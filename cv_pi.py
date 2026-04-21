import numpy as np
import cv2 as cv
from time import sleep
from picamera2 import Picamera2

#Constants
WIDTH = 1280
HEIGHT = 720
CAMERA_ENUM = 1
INIT_FRAMES = 10
CANNY_LOW = 128
CANNY_HIGH = 255
KERNEL = np.ones((7, 7), dtype = np.uint8)
THICKNESS = 40
SPOT_CANNY_LOW = 100
SPOT_CANNY_HIGH = 200
NUM_SPOTS = 8
SPOT_MIN_AREA = 40000
SPOT_MAX_AREA = 60000
SPOT_MIN_WIDTH = 160
SPOT_MIN_HEIGHT = 180
CAR_MIN_WIDTH = 100
CAR_MIN_HEIGHT = 100

#Camera initialization
picam2 = Picamera2()
config = picam2.create_preview_configuration(
    main={"size": (WIDTH, HEIGHT), "format": "BGR888"}
)
picam2.configure(config)
picam2.start()
sleep(2)

#Bacground subtraction init
MOG2 = cv.createBackgroundSubtractorMOG2()

#Process initialization frames
for i in range(INIT_FRAMES):
	frame = picam2.capture_array()
	foreground = MOG2.apply(frame, learningRate = 1/INIT_FRAMES)

#Process spot detection frame(s) until correct enumeration is constructed
spots = []
spots_compare = []
while len(spots) != NUM_SPOTS:
	frame = picam2.capture_array()
	#Find outer border of lot
	frame_gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
	frame_gray_blur = cv.GaussianBlur(frame_gray, (7, 7), 0)
	#lot_empty_canny = cv.Canny(frame_gray_blur, SPOT_CANNY_LOW, SPOT_CANNY_HIGH)
	_, lot_empty_canny = cv.threshold(frame_gray_blur, 200, 255, cv.THRESH_BINARY)
	lot_empty_cont, lot_empty_enum = cv.findContours(lot_empty_canny, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
	bounds = []
	bound_area = 0
	for cont in lot_empty_cont:
		x, y = cv.minAreaRect(cont)[1]
		if(x * y > bound_area):
			bound_area = x * y
			bounds = np.intp(cv.boxPoints(cv.minAreaRect(cont)))
	#print(bound_area)
	cv.rectangle(frame_gray_blur, bounds[0], bounds[2], (255, 255, 255), THICKNESS)
	#Find borders of individual spaces
	lot_spaces_canny = cv.Canny(frame_gray_blur, SPOT_CANNY_LOW, SPOT_CANNY_HIGH)
	lot_spaces, lot_spaces_enum = cv.findContours(lot_spaces_canny, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)
	lot_spaces_post = []
	lot_spaces_tmp = []
	for cont_num in range(len(lot_spaces)):
		min_rect = cv.minAreaRect(cont)
		cont = lot_spaces[cont_num]
		x, y = min_rect[1]
		area = x * y
		#print(area)
		overlap = False
		for spot in lot_spaces_tmp:
			print(area)
			if cv.rotatedRectangleIntersection(spot, min_rect)[0] != 0:
				overlap = True
		if not overlap and area > SPOT_MIN_AREA and area < SPOT_MAX_AREA and lot_spaces_enum[0][cont_num][2] == -1 and x > SPOT_MIN_WIDTH and y > SPOT_MIN_HEIGHT:
			rect = np.intp(cv.boxPoints(min_rect))
			lot_spaces_tmp.append(min_rect)
			lot_spaces_post.append(rect)
	spots = lot_spaces_post
	spots_compare = lot_spaces_tmp
	print(str(len(spots)) + " spots detected.")
	cv.imshow("Camera", frame_gray_blur)
	if cv.waitKey(1) == ord('q'):
		break
	
#Mainloop
while True:
	frame = picam2.capture_array()
	foreground = MOG2.apply(frame, learningRate = 0.001)
	lot_canny = cv.Canny(foreground, CANNY_LOW, CANNY_HIGH)
	lot_canny_close = cv.morphologyEx(lot_canny, cv.MORPH_CLOSE, KERNEL)
	lot_cars, lot_cars_enum = cv.findContours(lot_canny_close, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
	lot_occupancy = [0] * NUM_SPOTS
	for car_enum in range(len(lot_cars)):
		car_rect = cv.minAreaRect(lot_cars[car_enum])
		x, y = car_rect[1]
		area = x * y
		for spot_enum in range(len(spots)):
			if cv.rotatedRectangleIntersection(car_rect, spots_compare[spot_enum])[0] != 0 and x > CAR_MIN_WIDTH and y > CAR_MIN_HEIGHT:
				lot_occupancy[spot_enum] = 1
	#Debugging to display
	for space_enum in range(len(spots)):
		space = spots[space_enum]
		color = (255, 0, 0)
		if lot_occupancy[space_enum] == 1:
			color = (0, 0, 255)
			print("Space occupied")
		cv.rectangle(lot_canny_close, space[0], space[2], color, -1)
	#cv.drawContours(lot_canny_close, spots, -1, (0, 0, 255), 3)
	cv.imshow("Camera", lot_canny_close)

	if cv.waitKey(1) == ord('q'):
		break


#Uninitialization
picam2.stop()
cv.destroyAllWindows()
