use image::{
    ImageBuffer,
    Luma,
    open,
};

use imageproc::{
    hough::{
        LineDetectionOptions,
        PolarLine,
        detect_lines,
        intersection_points,
    },
    contours::{
        Contour,
        find_contours,
    },
    geometry::{
        contour_area,
        min_area_rect,
    },
    point::{
        Point,
    },
};

use crate::constants::{
    HOUGH_THRESH,
    WIN_RES,
};


pub fn hough_lines(image: &ImageBuffer<Luma<u8>, Vec<u8>>) -> Vec<((f32, f32), (f32, f32))>{
    let opt = LineDetectionOptions {
        vote_threshold: HOUGH_THRESH,
        suppression_radius: 8,
    };
     
    let polar_lines = detect_lines(image, opt);
    let mut rect_lines: Vec<((f32, f32), (f32, f32))> = Vec::new();
    for line in polar_lines {
        rect_lines.push(intersection_points(line, WIN_RES.0 as u32, WIN_RES.1 as u32).unwrap());
    }
    return rect_lines;
}

pub fn get_contours(buf: ImageBuffer<Luma<u8>, Vec<u8>>) -> Vec<Contour<i32>>{
    let mut output = Vec::new();
    for contour in find_contours::<i32>(&buf) {
        output.push(contour.clone());
        //if contour.points.len() == 4 {
        //    let points: [Point<i32>; 4] = contour.points.clone().try_into().unwrap();
        //    output.push(contour)
        //}
    }
    return output;
}

pub fn get_rects(contours: Vec<Contour<i32>>) -> Vec<[Point<i32>; 4]> {
    let mut output: Vec<[Point<i32>; 4]> = Vec::new();
    for contour in contours {
        output.push(min_area_rect(&contour.points));
    }
    return output;
}

pub fn area_filter(rects: Vec<[Point<i32>; 4]>, min_area: i32) -> Vec<[Point<i32>; 4]>{
    let area_sq = min_area ^ 2;
    let mut output: Vec<[Point<i32>; 4]> = Vec::new();
    for rect in rects {
        let mut dx2 = 0;
        let mut dy2 = 0;
        for i in rect {
            if (rect[0].x - i.x) ^ 2 > dx2 {
                dx2 = (rect[0].x - i.x) ^ 2;
            }
            if (rect[0].y - i.y) ^ 2 > dy2 {
                dy2 = (rect[0].y - i.y) ^ 2
            }
        }
        //let width_sq = (a.x - b.x) ^ 2 + (a.y - b.y) ^ 2;
        //let height_sq = (a.x - c.x) ^ 2 + (a.y - c.y) ^ 2;
        if dx2 * dy2 > area_sq {
            output.push(rect);
        }
    }
    return output;
}

//pub fn check_overlap(background: Vec<Vec<Vertex>>, foreground: Vec<Vec<Vertex>>) {
//
//}
