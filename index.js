const fs = require('fs');
const { XMLParse } = require('./lib/xml');
const data = fs.readFileSync('./dummy/isclog-cutdown.xml');

const xml = new XMLParse();

const isclog = [];
xml.on('size', size => console.log(size));
xml.on('$lb', arr => isclog.push({data: arr, sub: []}));
xml.on('sub', str => isclog[isclog.length - 1].sub.push(str));
xml.on('done', () => console.log(isclog));
xml.write(data);
