const json2xml = require('json2xml');
const progress = require('./progress');
const fastXmlParser = require('fast-xml-parser');
const xml2js = require('xml2js-parser').parseStringSync;

const fs = require('fs')
const path = require('path');

class transfer {
    constructor() {
        this.object = [];//里面存放的一个obj数据格式为：
        /**
         * {
	"object":{
		"name": name,
		"bndbox":[{xmin:xx},{ymin:xx},{xmax:xx},{ymax:xx}]
		
	}
}
         */
        this.folder = {
            'folder': ''
        }
        this.filename = {
            'filename': ''
        }
        this.size = {
            'size': []
        };
        this.data = {
            'annotation': []
        }
        /**
         * data:
         * {
         *      'annotation': this.object.append(this.folder, this.filename, this.size)
         * }
         */
    }
    async getAllFileName() {
        let filePath = process.argv[2]
        if (filePath === undefined || filePath === null) {
            filePath = '.';
        }

        let fileList = await fs.readdirSync(filePath);
        return fileList;
    }

    async singleToXml(filePath) {
        let desPath = process.argv[3]
        
        let isexist = await fs.existsSync(desPath);
        if(!isexist) await fs.mkdirSync(desPath);
        let name = filePath.split('/').pop().split('.')[0];
        desPath = path.join(desPath, `${name}.xml`)
        this.filename.filename = `${name}.jpg`
        this.folder.folder = desPath;
        let data = await fs.readFileSync(filePath, 'utf8')
        const json = fastXmlParser.parse(data);
        await this.checkXmlKey(json)
        await this.data.annotation.push(this.folder)
        await this.data.annotation.push(this.filename);
        await this.data.annotation.push(this.size)
        await fs.writeFileSync(desPath, json2xml(this.data, { header: true }));
        await this.data.annotation.splice(0,this.data.annotation.length)
        await this.size.size.splice(0, this.size.size.length)
        this.filename.filename = '';
        this.folder.folder = '';

        return desPath;
    }

    async parseString(data) {

    }

    async checkXmlKey(json) {
        if(!json.hasOwnProperty('annotation')) {
            throw `json failed:${json}`
        }
        let annotation = json.annotation;
        this.size.size.push({
            'width':annotation.size.width
        })
        this.size.size.push({
            'height':annotation.size.height
        })
        this.size.size.push({
            'depth':annotation.size.depth
        })
        let objects = annotation.object;
        let boolArr = objects instanceof Array;
        let boolObj = objects instanceof Object;
        if(boolArr) {
            for (let object of objects) {
                let bndbox = object.bndbox;
                await this.data.annotation.push(this.newObject(object.text, object.name, bndbox.xmin,bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymin, bndbox.xmax, bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymax ))
                await this.save2Txt(object.text, bndbox.xmin, bndbox.ymin, bndbox.xmax, bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymax)
            }
            return;
        }

        if(boolObj) {
            let bndbox = objects.bndbox;
            await this.data.annotation.push(this.newObject(objects.text, objects.name, bndbox.xmin,bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymin, bndbox.xmax, bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymax ))
            await this.save2Txt(objects.text, bndbox.xmin, bndbox.ymin, bndbox.xmax, bndbox.ymin, bndbox.xmax, bndbox.ymax, bndbox.xmin, bndbox.ymax)
        }

    }

    async checkKey(json) {
        let boolArr = json instanceof Array;
        let boolObj = json instanceof Object;

        if (boolObj && Object.keys(json).length !== 0) {
            let keys = Object.keys(json);
            for (let key of keys) {
                if (key === 'width') {
                    this.size.size.push({
                        'width': json[key]
                    })
                } else if (key === 'height') {
                    this.size.size.push({
                        'height': json[key]
                    })

                } else if (key === 'channel') {
                    this.size.size.push({
                        'depth': json[key]
                    })
                } else if (key === 'text' && json[key] !== undefined && json[key] !== '') {
                    //TODO
                    //distinct rotated and text out
                    if (keys.indexOf('rotated_box') > -1 && json[key] !== undefined) {
                        let rotated_box = json['rotated_box'];
                        if (rotated_box.length === 4) {
                            let xList = [];
                            xList.push(rotated_box[0][0])
                            xList.push(rotated_box[1][0])
                            xList.push(rotated_box[2][0])
                            xList.push(rotated_box[3][0])

                            let yList = []
                            yList.push(rotated_box[0][1])
                            yList.push(rotated_box[1][1])
                            yList.push(rotated_box[2][1])
                            yList.push(rotated_box[3][1]);

                            let xmin = Math.min.apply(null, xList);
                            let xmax = Math.max.apply(null, xList)
                            let ymin = Math.min.apply(null, yList)
                            let ymax = Math.max.apply(null, yList);
                            this.data.annotation.push(this.newObject(json[key], 'text' , xmin, ymin, xmax, ymax, rotated_box[1][0], rotated_box[1][1], rotated_box[2][0], rotated_box[2][1], rotated_box[3][0], rotated_box[3][1] ,rotated_box[0][0], rotated_box[0][1]))
                        } else {
                            console.error('rotated_box err:', rotated_box)
                        }
                    } else if (keys.indexOf('box') > -1 && json[key] !== undefined) {
                        //TODO 配合上面代码生成8位数据
                        let box = json['box'];
                        if (json['direction'] === 'left_to_right') {
                            this.data.annotation.push(this.newObject(json[key], 'text', box.xmin, box.ymin, box.xmax, box.ymax, box.xmin, box.ymin, box.xmax, box.ymin, box.xmax, box.ymax, box.xmin, box.ymax ));                            
                        } else if( json['direction'] === 'down_to_up' ) {
                            this.data.annotation.push(this.newObject(json[key], 'text', box.xmin, box.ymin, box.xmax, box.ymax, box.xmin, box.ymax, box.xmin, box.ymin, box.xmax, box.ymin, box.xmax, box.ymax ));                            
                        } else if( json['direction'] === 'up_to_down' ) {
                            this.data.annotation.push(this.newObject(json[key], 'text', box.xmin, box.ymin, box.xmax, box.ymax, box.xmax, box.ymin, box.xmax, box.ymax, box.xmin, box.ymax, box.xmin, box.ymin ));
                        } else {
                            // console.error('err occuerd : nobox ,json:',json)
                            this.data.annotation.push(this.newObject(json[key], 'text', box.xmin, box.ymin, box.xmax, box.ymax, box.xmin, box.ymin, box.xmax, box.ymin, box.xmax, box.ymax, box.xmin, box.ymax ));                                                        
                            // throw json;
                        }
                    }
                    
                    delete json[key]
                } else if (json[key] !== [] && json[key] !== null && json[key] !== '') {
                    this.checkKey(json[key])
                }
            }
        }

        if (boolArr && json.length !== 0) {
            for (let value of json) {
                this.checkKey(value);
            }
        }

    }

    newObject(content, name, xmin, ymin, xmax, ymax, x1, y1, x2, y2, x3, y3, x4, y4) {
        let obj = {
            'object': {
                'content': content,
                'difficult': 0,
                'name': name,
                "bndbox": [{xmin: xmin}, {ymin: ymin}, {xmax: xmax}, {ymax: ymax},{ x1: x1 }, { y1: y1 }, { x2: x2 }, { y2: y2 }, { x3: x3 }, { y3: y3 }, { x4: x4 }, { y4: y4 }]
            }
        }
        return obj;
    }
    async save2Txt(content,x1, y1, x2, y2, x3, y3, x4, y4){
        await fs.appendFileSync(`./txt_part2/${this.filename.filename.split('.')[0]}.txt`,`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} ${x4} ${y4} 0 ${content}\n`)
    }

    async transfer() {
        let list = await this.getAllFileName();

        let pb = new progress('转换进度', list.length);
        let filePath = process.argv[2]
        let num = 1;
        for (let single of list) {
            let des = await this.singleToXml(filePath + single);
            pb.render({
                completed: num,
                total : list.length
            })
            num++;
            console.log('num:',num,'/',list.length);
        }
    }
}

process.argv[2] = process.argv[2] || './reviewed_xmls_part2/';
process.argv[3] = process.argv[3] || './xml_part2/' ; 
let test = new transfer();
(async () => {
    await test.transfer();
    console.log('转换完成');
})().catch(err => {
    console.error('err:', err)
})

