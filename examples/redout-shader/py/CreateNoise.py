from PIL import Image
import math
import random

imgsize = 256

img = Image.new("RGBA", (imgsize, imgsize), "black")

pixels = img.load() # create the pixel map

r = g = b = a = 0

for i in range(img.size[0]):    # for every pixel:
    for j in range(img.size[1]):
        theta = random.uniform(0.0, 2 * math.pi)
        
        r = math.cos(theta) * 128 + 127
        g = math.sin(theta) * 128 + 127
        b = random.uniform(0.0, 256.0)
        a = 255

        pixels[i,j] = ( int(r), int(g), int(b), int(a))

img.save("noise.png")