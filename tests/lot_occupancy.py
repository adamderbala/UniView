#Used for testing parameters.  Will not be used in production environment and GLSL equivalent to included matrix operations is WIP

import numpy as np
import cv2 as cv
import matplotlib.pyplot as plt

#Load images
empty_image_path = "empty.png"
live_image_path = "live.png"
lot_empty = cv.imread(empty_image_path)
lot_live = cv.imread(live_image_path)
#Filter out background noise (this is for shadow removal and will become less relevant with the IR camera put into place later)
bgsub = cv.bgsegm.createBackgroundSubtractorMOG()
lot_empty_mask = bgsub.apply(lot_empty, learningRate = 0)
lot_live_mask = bgsub.apply(lot_live, learningRate = 0)
#Convert to grayscale
lot_empty_grey = cv.cvtColor(lot_empty, cv.COLOR_BGR2GRAY)
lot_live_grey_unmasked = cv.cvtColor(lot_live, cv.COLOR_BGR2GRAY)
lot_live_grey = cv.bitwise_and(lot_live_grey_unmasked, lot_live_grey_unmasked, mask = lot_live_mask)
#Take difference between preprocessed empty and full lots and perform edge detection on this delta
lot_diff = cv.absdiff(lot_live_grey, lot_empty_grey)
lot_canny = cv.Canny(lot_diff, 20, 60)
#Construct matrix for smoothing around each pixel to remove noise (in this case simply taking the average of each pixel and its surroundings)
kernel = np.ones((3, 3), dtype = np.uint8)
lot_canny_closed = cv.morphologyEx(lot_canny, cv.MORPH_CLOSE, kernel)
lot_cont, lot_cont_enum = cv.findContours(lot_canny_closed, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
#Construct rectangles and filter out those that do not meet the parameters that define a vehicle
lot_cont_post = []
for cont in lot_cont:
	rect_area = cv.minAreaRect(cont)[1][1] * cv.minAreaRect(cont)[1][0]
	if(rect_area > 40000 and rect_area < 100000):
		rect = np.intp(cv.boxPoints(cv.minAreaRect(cont)))
		lot_cont_post.append(rect)
#Draw to output image for demonstration
cv.drawContours(lot_live, lot_cont_post, -1, (255, 0, 0), 3)

#Repeat process above on empty lot image to get edges of parking spaces
lot_empty_canny = cv.Canny(lot_empty_grey, 150, 200)
lot_empty_cont, lot_empty_cont_enum = cv.findContours(lot_empty_canny, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
lot_empty_bound = []
lot_empty_bound_area = 0
for cont in lot_empty_cont:
	if(cv.contourArea(cont) > lot_empty_bound_area):
		lot_empty_bound_area = cv.contourArea(cont)
		lot_empty_bound = np.intp(cv.boxPoints(cv.minAreaRect(cont)))
cv.rectangle(lot_empty_grey, lot_empty_bound[0], lot_empty_bound[2], (255, 255, 255))
lot_spaces_canny = cv.Canny(lot_empty_grey, 150, 200)
lot_spaces, lot_spaces_enum = cv.findContours(lot_spaces_canny, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)
lot_spaces_post = []
for cont in lot_spaces:
	area = cv.contourArea(cont)
	print(area)
	if(area > 50000 and area < 100000):
		rect = np.intp(cv.boxPoints(cv.minAreaRect(cont)))
		lot_spaces_post.append(rect)

#Display to screen for demo viewing
cv.drawContours(lot_live, lot_spaces_post, -1, (0, 0, 255), 3)
plt.imshow(lot_live)
plt.show()