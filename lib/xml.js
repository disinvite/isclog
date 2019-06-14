// for importing from xml

const $list = require('./dollarlist');
const { EventEmitter } = require('events');
const sax = require('sax');
const STATE = {
  BEGIN: 'BEGIN',
  EXPORT: 'EXPORT',
  GLOBAL: 'GLOBAL',
  NODE_UNKNOWN: 'NODE_UNKNOWN',
  SUB_CHECK_IF_ISCLOG: 'SUB_CHECK_IF_ISCLOG',
  NODE_NOT_ISCLOG: 'NODE_NOT_ISCLOG',
  NODE_ISCLOG: 'NODE_ISCLOG',
  NODE_ISCLOG_NODE_UNKNOWN: 'NODE_ISCLOG_NODE_UNKNOWN',
  SUB_CHECK_IF_DATA: 'SUB_CHECK_IF_DATA',
  NODE_ISCLOG_DATA: 'NODE_ISCLOG_DATA',
  NODE_ISCLOG_SUBSCRIPT: 'NODE_ISCLOG_SUBSCRIPT',
  NODE_ISCLOG_SUBSCRIPT_SUB: 'NODE_ISCLOG_SUBSCRIPT_SUB',
  FINISHED: 'FINISHED',
  EMIT_SIZE: 'EMIT_SIZE',
  EMIT_DOLLARLIST: 'EMIT_DOLLARLIST',
  EMIT_SUB: 'EMIT_SUB'
}

class XMLParse extends EventEmitter {
  constructor() {
    super();
    this.parser = sax.parser(true);
    this.currentState = STATE.BEGIN;
    this.prevState = null;
    this.ignoreCounter = 0;

    this.parser.onopentag = (node) => {
      if(node.name === 'Export') {
        if (this.currentState === STATE.BEGIN) {
          this.currentState = STATE.EXPORT;
        }
      } else if(node.name === 'Global') {
        if (this.currentState === STATE.EXPORT) {
          this.currentState = STATE.GLOBAL;
        }
      } else if(node.name === 'Node') {
        if (this.currentState === STATE.GLOBAL) {
          this.currentState = STATE.NODE_UNKNOWN;
        } else if (this.currentState === STATE.NODE_ISCLOG) { 
          this.currentState = STATE.NODE_ISCLOG_NODE_UNKNOWN;
        } else if (this.currentState === STATE.NODE_ISCLOG_DATA) {
          this.currentState = STATE.NODE_ISCLOG_SUBSCRIPT
        } else if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT) {
          this.currentState = STATE.NODE_ISCLOG_SUBSCRIPT_SUB;
        }
      } else if(node.name === 'Sub') {
        if (this.currentState === STATE.NODE_UNKNOWN) {
          this.currentState = STATE.SUB_CHECK_IF_ISCLOG;
        } else if (this.currentState === STATE.NODE_ISCLOG_NODE_UNKNOWN) {
          this.currentState = STATE.SUB_CHECK_IF_DATA;
        } else if (this.currentState === STATE.NODE_NOT_ISCLOG) {
          this.ignoreCounter++;
        }
      } else if (node.name === 'Data') {
        if (this.currentState === STATE.NODE_ISCLOG_DATA) {
          this.prevState = this.currentState;
          this.currentState = STATE.EMIT_SIZE;
        } else if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT_SUB) {
          this.prevState = this.currentState;
          this.currentState = STATE.EMIT_SUB;
        }
      } else if (node.name === 'DataBase64') {
        if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT) {
          this.prevState = this.currentState;
          this.currentState = STATE.EMIT_DOLLARLIST;
        }
      } else if (node.name === 'DataCrLf') {
        if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT_SUB) {
          this.prevState = this.currentState;
          this.currentState = STATE.EMIT_SUB;
        }
      }
      //console.log(`~  <${node.name}> --> ${this.currentState}`);
    };

    this.parser.onclosetag = (nodename) => {
      if (this.ignoreCounter > 0) {
        this.ignoreCounter--;
        return;
      }

      if(nodename === 'Export') {
        if (this.currentState === STATE.EXPORT) {
          this.currentState = STATE.FINISHED;
          this.emit('done', null);
        }
      } else if(nodename === 'Global') {
        if (this.currentState = STATE.GLOBAL) {
          this.currentState = STATE.EXPORT;
        }
      } else if(nodename === 'Node') {
        if (this.currentState === STATE.NODE_ISCLOG) { 
          this.currentState = STATE.GLOBAL;
        } else if (this.currentState === STATE.NODE_NOT_ISCLOG) {
          this.currentState = STATE.GLOBAL;
        } else if (this.currentState === STATE.NODE_ISCLOG_DATA) {
          this.currentState = STATE.NODE_ISCLOG;
        } else if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT) {
          this.currentState = STATE.NODE_ISCLOG_DATA;
        } else if (this.currentState === STATE.NODE_ISCLOG_SUBSCRIPT_SUB) {
          this.currentState = STATE.NODE_ISCLOG_SUBSCRIPT;
        }
      } else if(nodename === 'Sub') {
      }

      //console.log(`  $  <${nodename}> --> ${this.currentState}`);
    }

    this.parser.ontext = (text) => {
      if (this.ignoreCounter > 0) {
        return;
      }

      if(this.currentState === STATE.SUB_CHECK_IF_ISCLOG) {
        if(text === '^%ISCLOG') {
          this.currentState = STATE.NODE_ISCLOG;
        } else {
          this.currentState = STATE.NODE_NOT_ISCLOG;
        }
      } else if (this.currentState === STATE.SUB_CHECK_IF_DATA) {
        if(text === 'Data') {
          this.currentState = STATE.NODE_ISCLOG_DATA;
        } else {
          // hmm
        }
      } else if (this.currentState === STATE.EMIT_SIZE) {
        this.emit('size', text);
        this.currentState = this.prevState;
        this.prevState = null;
      } else if (this.currentState === STATE.EMIT_DOLLARLIST) {
        const buf = Buffer.from(text.trim(), 'base64');
        this.emit('$lb', $list(buf));
        this.currentState = this.prevState;
        this.prevState = null;
      } else if (this.currentState === STATE.EMIT_SUB) {
        this.emit('sub', text.trim());
        this.currentState = this.prevState;
        this.prevState = null;
      }
    }

    //this.parser.onend = () => this.emit('ready?', null);
  }

  write(data) {
    this.parser.write(data);
  }
}

exports.XMLParse = XMLParse;