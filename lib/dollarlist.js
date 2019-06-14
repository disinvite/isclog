// for converting from $list format
// incomplete but good enough for ISCLOG.

function convert(buf) {
  const out = [];
  let i = 0;
  let size;
  let type;
  let start;
  let end;

  while (i < buf.length) {
    if (buf.readUInt8(i) !== 0) {
      size = buf.readUInt8(i);
      type = buf.readUInt8(i + 1);
      start = i + 2;
      end = i + size;
    } else if (buf.readUInt16LE(i + 1) !== 0) {
      size = buf.readUInt16LE(i + 1) + 3;
      type = buf.readUInt8(i + 2);
      start = i + 4;
      end = i + size;
    } else {
      // big
    }

    if (type === 1) {
      // ascii string
      out.push(buf.toString('ascii', start, end));
    } else if (type === 4) {
      // positive int
      if (start === end) {
        out.push(0);
      } else {
        out.push(buf.readIntLE(start, end - start));
      }      
    } else if (type === 5) {
      // negative int
      if (start === end) {
        out.push(-1);
      } else {
        out.push(buf.readIntLE(start, end - start));
      }      
    } else {
      out.push('$$$$'); // TODO
    }

    i += size;
  }
  return out;
}

module.exports = convert;