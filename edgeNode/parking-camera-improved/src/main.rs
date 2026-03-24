use std::{
    fs,
};

use glium::{
    framebuffer::SimpleFrameBuffer,
    Texture2d,
};

mod window;
mod video;
mod draw;
mod constants;
mod lines;

use crate::lines::{
    get_contours,
    get_rects,
    get_spaces,
    check_overlap,
    area_filter,
};

use crate::constants::{
    WIN_RES,
    USING_CAMERA,
    CAMERA_NUM,
    RECT_MIN_AREA_INIT,
    RECT_MIN_AREA_CAR,
    INIT_FRAMES,
    NUM_SPACES,
    LOT_ID,
    REPORT_PATH,
    SPOT_ID_PREFIX,
};


fn run_blur_passes(
    disp: &glium::backend::glutin::Display<glium::glutin::surface::WindowSurface>,
    mut current_tex: Texture2d,
    pass_count: usize,
) -> Texture2d {
    let mut next_tex = Texture2d::empty(disp, WIN_RES.0, WIN_RES.1).unwrap();
    for _ in 0..pass_count {
        let mut next_fb = SimpleFrameBuffer::new(disp, &next_tex).unwrap();
        draw::draw_blur(disp, &mut Some(next_fb), &current_tex);
        std::mem::swap(&mut current_tex, &mut next_tex);
    }
    current_tex
}

fn run_dilation_passes(
    disp: &glium::backend::glutin::Display<glium::glutin::surface::WindowSurface>,
    mut current_tex: Texture2d,
    pass_count: usize,
) -> Texture2d {
    let mut next_tex = Texture2d::empty(disp, WIN_RES.0, WIN_RES.1).unwrap();
    for _ in 0..pass_count {
        let mut next_fb = SimpleFrameBuffer::new(disp, &next_tex).unwrap();
        draw::draw_dilation(disp, &mut Some(next_fb), &current_tex);
        std::mem::swap(&mut current_tex, &mut next_tex);
    }
    current_tex
}

fn run_erosion_passes(
    disp: &glium::backend::glutin::Display<glium::glutin::surface::WindowSurface>,
    mut current_tex: Texture2d,
    pass_count: usize,
) -> Texture2d {
    let mut next_tex = Texture2d::empty(disp, WIN_RES.0, WIN_RES.1).unwrap();
    for _ in 0..pass_count {
        let mut next_fb = SimpleFrameBuffer::new(disp, &next_tex).unwrap();
        draw::draw_erosion(disp, &mut Some(next_fb), &current_tex);
        std::mem::swap(&mut current_tex, &mut next_tex);
    }
    current_tex
}

fn sort_spaces_left_to_right(spaces: &mut [[imageproc::point::Point<i32>; 4]]) {
    spaces.sort_by_key(|space| space.iter().map(|point| point.x).min().unwrap_or(0));
}

fn write_report(occupied_spots: &[String]) {
    let report_path = std::path::Path::new(REPORT_PATH);
    if let Some(parent_dir) = report_path.parent() {
        fs::create_dir_all(parent_dir).unwrap();
    }

    let occupied_spots_json = occupied_spots
        .iter()
        .map(|spot_id| format!("\"{}\"", spot_id))
        .collect::<Vec<_>>()
        .join(", ");
    let report = format!(
        concat!(
            "{{\n",
            "  \"lot_id\": \"{}\",\n",
            "  \"occupied_spots\": [{}]\n",
            "}}\n"
        ),
        LOT_ID,
        occupied_spots_json,
    );
    fs::write(report_path, report).unwrap();
}


fn mainloop(appl: &mut window::Application, frame_num: u32) {
    let disp = appl.get_display().clone().unwrap();
    let cam_tex = appl.get_frame();
    let mut blur_tex = Texture2d::empty(&disp, WIN_RES.0, WIN_RES.1).unwrap();
    let cam_fb = SimpleFrameBuffer::new(&disp, &blur_tex).unwrap();
    let mut suppression_tex = Texture2d::empty(&disp, WIN_RES.0, WIN_RES.1).unwrap();
    let gradient_fb = SimpleFrameBuffer::new(&disp, &suppression_tex).unwrap();
    let mut threshholding_tex = Texture2d::empty(&disp, WIN_RES.0, WIN_RES.1).unwrap();
    let suppression_fb = SimpleFrameBuffer::new(&disp, &threshholding_tex).unwrap();
    let mut dilation_tex = Texture2d::empty(&disp, WIN_RES.0, WIN_RES.1).unwrap();
    let threshholding_fb = SimpleFrameBuffer::new(&disp, &dilation_tex).unwrap();
    let mut cam_ptr = Some(cam_fb);
    if frame_num < INIT_FRAMES {
        draw::draw_texture(&disp, &mut cam_ptr, &cam_tex);
    } else {
        draw::draw_subtract(&disp, &mut cam_ptr, &cam_tex, appl.background.as_ref().unwrap());
    }
    blur_tex = run_blur_passes(&disp, blur_tex, 4);
    draw::draw_gradient(&disp, &mut Some(gradient_fb), &blur_tex);
    draw::draw_suppression(&disp, &mut Some(suppression_fb), &suppression_tex);
    draw::draw_threshholding(&disp, &mut Some(threshholding_fb), &threshholding_tex);
    dilation_tex = run_dilation_passes(&disp, dilation_tex, 8);
    let erosion_tex = run_erosion_passes(&disp, dilation_tex, 8);
    let grayscale = draw::rgba_to_grayscale(&erosion_tex);
    let contours = get_rects(get_contours(grayscale.clone()));
    if frame_num >= INIT_FRAMES && contours.len() > 0 {
        let cars = area_filter(contours.clone(), RECT_MIN_AREA_CAR);
        draw::draw_contours(&disp, &mut None, cars.clone());
        let mut spaces = appl.init_spaces.clone().unwrap();
        sort_spaces_left_to_right(&mut spaces);
        let overlaps = check_overlap(cars.clone(), spaces.clone());
        let mut num_occupied = 0;
        let mut occupied_spot_ids = Vec::new();
        for (index, overlap) in overlaps.iter().enumerate() {
            if overlap {
                num_occupied += 1;
                occupied_spot_ids.push(format!("{}{}", SPOT_ID_PREFIX, index + 1));
            }
        }
        write_report(&occupied_spot_ids);
        println!("{} spaces occupied.", num_occupied);
    }
    if frame_num < INIT_FRAMES {
        let mut init_tex = Texture2d::empty(&disp, WIN_RES.0, WIN_RES.1).unwrap();
        let mut init_fb = SimpleFrameBuffer::new(&disp, &init_tex).unwrap();
        draw::draw_contours(&disp, &mut Some(init_fb), area_filter(contours.clone(), RECT_MIN_AREA_INIT));
        appl.write_contours(contours);
        let rects = get_rects(get_contours(grayscale.clone()));
        let mut spaces = get_spaces(rects.clone());
        sort_spaces_left_to_right(&mut spaces);
        appl.init_spaces = Some(spaces.clone());
        let cam_vec: Vec<Vec<(u8, u8, u8, u8)>> = cam_tex.read();
        appl.background = Some(Texture2d::new(&disp, cam_vec).unwrap());
        if spaces.len() != NUM_SPACES && frame_num == INIT_FRAMES - 1{
            appl.initialized -= 1;
        }
    }
    appl.initialized += 1;
    //println!("{}", contours[0].points[0].x); 
    //let lines = polar_lines_to_rect_lines(hough_lines(&grayscale));
    //thread::sleep(Duration::from_secs(15));
    println!("Frame {} update complete", appl.initialized);
}

fn main() {
    let mut appl = window::Application::new();
    appl.initialize(WIN_RES.0, WIN_RES.1, "CV Window");
    appl.setup_frame();

    if USING_CAMERA {
        appl.init_camera(CAMERA_NUM);
    }

    appl.run_loop(mainloop);
}
