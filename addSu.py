import os
if __name__ == "__main__":
    path = 'train.txt'
    fileRead = open(path, 'r')
    lines = fileRead.readlines()
    fileRead.close()
    fileWrite = open(path, 'w')
    for line in lines: 
        singleLine = line.strip("\n").split(" ")
        saveLine = singleLine[0] + " " + singleLine[1] + ".xml\n"
        fileWrite.write(saveLine)
    fileWrite.close
    