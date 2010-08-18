/////////////// DO NOT EDIT, FILE IS GENERATED ///////////////

/*
 
  CSSParser.js v0.1
 
  A CSS parser written in javascript. 
 
  Copyright 2010, Francois Lafortune, quickredfox
  Licensed MIT
 
  CSSParser is a re-write of the MIT Licensed jquery-css-parser 
  found here http://bililite.com/blog/2009/01/16/jquery-css-parser
  Which is copyrighted 2009 Daniel Wachsstock. MIT Licensed.
 
  The idea was to separate the parser from jquery and my concerns
  being different than the original author's intent, I simply 
  decided it would be more convenient to just copy/paste and 
  mix it up a little. Also, I was not satisfied /w the original API.
  
 
  Usage:
 
   The code below is all you need to write your own processor:
   
   CSSParser.addProcessor('myprocessor',
       function(css) {
           var parsed = {};
           for(var selector in css){
               var properties = css[selector];
               for(var property in properties){
                   var value = properties[property];
                   // do something with value for example
                   if(/px/.test(value)) parsed[selector][property] = value.replace(/px/g,'em');
               }
           }
           return parsed;
       }
   );
 
*/
(function(window,undefined){
/* 
    Internal Variables
*/
var uid = 0,
cache = {
    media: {},
    munged: {}
},
/* 
    Regular Expressions Collection
*/
RE = {
    braces: (/\{[^\{\}]*\}/),
    full: (/\[[^\[\]]*\]|{[^{}]*}|\([^()]*\)|function(\s+\w+)?(\s*%b`\d+`b%){2}/),
    atComment: (/\/\*@((?:[^\*]|\*[^\/])*)\*\//g),
    atRule: (/@(([^;`]|`[^b]|`b[^%])*(`b%)?);?/g),
    commentString: (/(?:\/\*(?:[^\*]|\*[^\/])*\*\/)|(\\.|"(?:[^\\\"]|\\.|\\\n)*"|'(?:[^\\\']|\\.|\\\n)*')/g),
    munged: (/%\w`(\d+)`\w%/),
    SGMLComment: (/<!--([^-]|-[^-])*-->/g),
    isNotATag: (/(>)[^<]*/g),
    isATag: (/<(\w+)([^>]*)>/g),
    unknown: (/UNKNOWN/i)
};
/* 
    Sans-jQuery-Helpers 
*/
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};
function each(thing, fn) {
    var acc = [],temp;
    var flip = function(thing,i) {
        try{
           temp = fn.call(thing[i],i,thing[i]);
        }catch(E){ temp = E; }
        acc.push(temp)
    };
    if (thing instanceof Array){
      for (i = 0; i < thing.length; i++){
          flip(thing,i);
      }
    }else{ 
        for (var i in thing){ 
            flip(thing,i); 
        }
    };  
    return acc;
};
function clone(obj){
    if(obj == null || typeof obj != 'object') return obj;
    var temp = new obj.constructor(); 
    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
};
function extend() {
    var args = Array.prototype.slice.call(arguments, 0),
    t = args.shift(),
    n = args.shift();
    if (!n) return t;
    for (var k in n) t[k] = n[k];
    args.unshift(n);
    return extend.apply(null, args);
};
function XHRGet(url, after) {
    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    if (!xhr) return false;
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) after(xhr.responseText, xhr.status);
    };
    xhr.open('GET', url, true);
    xhr.send(null);
};
function zIndex(el)
{
    if (typeof el == string) el = document.getElementById(el);
    return window.getComputedStyle ? document.defaultView.getComputedStyle(el, null).getPropertyValue('z-index') : el.currentStyle ? el.currentStyle['zIndex'] : null;
};

/* 
    Private Parser Functions
*/
function processAtRule(rule, processor) {
    return true;
    var split = rule.split(/\s+/),
    type = split.shift();
    if (type == 'media') {
        var css = restore(split.pop()).slice(1, -1);
        if (CSSParser.matchMedium(split.join(' '))) CSSParser.parse(css, processor);
    } else if (type = 'import') {
        var url = restore(split.shift());
        if (CSSParser.matchMedium(split.join(' '))) {
            url = url.replace(/^url\(|\)$/gi, '').replace(/^["']|["']$/g, '');
            XHRGet(url,
            function(str) {
                CSSParser.parse(str, processor);
            });
        };
    };
};
function parseDeclarations(index) {
    var str = cache.munged[index].replace(/^\{|\}$/g, ''),
    parsed = {};
    str = munge(str);
    each(str.split(';'),
    function(i, declaration) {
        declaration = declaration.split(':');
        if (declaration.length < 2) return;
        parsed[restore(declaration[0])] = restore(declaration[1]);
    });
    return parsed;
};
function munge(str, full) {
    var re = (full ? RE.full: RE.braces),
    str = str.replace(RE.atComment, '$1').replace(RE.commentString,
    function(s, string) {
        if (!string) return '';
        var replacement = '%s`' + (++uid) + '`s%';
        cache.munged[uid] = string.replace(/^\\/, '');
        return replacement;
    });
    while (match = re.exec(str)) {
        replacement = '%b`' + (++uid) + '`b%';
        cache.munged[uid] = match[0];
        str = str.replace(re, replacement);
    }
    return str;
};
function restore(str) {
    if (str === undefined) return str;
    while (match = RE.munged.exec(str)) str = str.replace(RE.munged, cache.munged[match[1]]);
    return trim(str);
};
function styleAttributes(source, processor) {
    var ret = '',
    style,
    tags = {},
    source = source.replace(RE.SGMLComment, '').replace(RE.isNotATag, '$1');
    munge(source).replace(RE.isATag,
    function(s, tag, attrs) {
        tag = tag.toLowerCase();
        if (tags[tag])++tags[tag];
        else tags[tag] = 1;
        if (style = /\bstyle\s*=\s*(%s`\d+`s%)/i.exec(attrs)) {
            var id = /\bid\s*=\s*(\S+)/i.exec(attrs);
            // find the id if there is one.
            if (id) id = '#' + restore(id[1]).replace(/^['"]|['"]$/g, '');
            else id = tag + ':eq(' + (tags[tag] - 1) + ')';
            ret += [id, '{', restore(style[1]).replace(/^['"]|['"]$/g, ''), '}'].join('');
        }
    });
    CSSParser.parse(ret, processor);
};
function getProc(processor) {
    if(typeof processor == 'undefined') return each(processors,
    function(name, processor) {
        return processor;
    });
    if(typeof processor == 'string') return CSSParser.getProcessor(processor);
    if(processor instanceof Array && typeof processor[0] == 'string'){
        return each(processors, function(i,name) {
            return CSSParser.getProcessor(name);
        })
    };
    return processor;
};
/* 
    CSSParser public interface (API)
*/
var processors = {};
window.CSSParser = {
    addProcessor: function(name, fn) {
        return processors[name] = fn;
    },
    removeProcessor: function(name) {
        return delete(processors[name]);
    },
    getProcessor: function(processor) {
        if (typeof processor == 'string') return processors[processor];
        else if(typeof processor == 'undefined') return processors.generic;
        else return processor;
    },
    parse: function(str, processor) {
        var ret = {},processor = getProc(processor),
        str = munge(str).replace(RE.atRule,
        function(s, rule) {
            processAtRule(trim(rule), processor);
            return '';
        });
        each(str.split('`b%'),
        function(i, css) {    
            css = css.split('%b`');
            if (css.length < 2) return;
            css[0] = restore(css[0]);
            ret[css[0]] = extend(ret[css[0]] || {},
            parseDeclarations(css[1]));
        });
        return processor(ret);
    },
    // see footnote #1
    matchMedium: (window.media && window.media.matchMedium) ||
    function(medium) {
        if (!medium) return true;
        if (medium in cache.media) return cache.media[medium];
        var style = CSSParser.addCSS('body {position: relative; z-index: 1;}');
        return cache.media[medium] = [zIndex(document.body) == 1, style.parentNode.removeChild(style)][0];
    },
    isValidSelector: function(str) {
        var s = $('<style>' + str + '{}</style>').appendTo('head')[0];
        return [s.styleSheet ? !(RE.unknown).test(s.styleSheet.cssText) : !!s.sheet.cssRules.length, $(s).remove()][0];
    },
    stringify: function(cssObject) {
        var css = [];
        each(cssObject,
        function(selector, properties) {
            css.push(selector + "{");
            each(properties,
            function(property, value) {
                css.push(property + ":" + value + ';');
            });
            css.push('}');
        });
        return css.join("\n");
    },
    addCSS: function(enhancements) {
        var enhanced = CSSParser.stringify(enhancements);
        var s = document.createElement("style");
        s.type = "text/css";
        $(s).attr("class", 'css3-enhancements');
        if (s.styleSheet) s.styleSheet.cssText = enhanced;
        else s.appendChild(document.createTextNode(enhanced));
        document.getElementsByTagName("head")[0].appendChild(s);
        return s;
    }
};


/* 
    Processor: Generic 
*/

window.CSSParser.addProcessor('generic', function(css) {
    return css;
});

/* 
    Processor: CSS3 Fixer 
*/
 (function() {
    var processor = function(css) {
        var enhanced = {};
        each(css,
        function(selector, properties) {
            each(properties,
            function(property, value) {
                var equivalents = processor.propMap[property]
                if (equivalents) {
                    if(!enhanced[selector]) enhanced[selector] = {};
                    each(equivalents,
                    function(i, equiv) {
                        if (typeof equiv == 'function') equiv(enhanced[selector], value)
                        else enhanced[selector][equiv] = value;
                    })
                }
            })
        });
        return enhanced;
    };
    extend(processor,{
        splitVal: function(value) {
            return each(value.split(' '),
            function(i, val) {
                return trim(val);
            })
        },
        propMap: {
            'box-sizing': ['-moz-box-sizing', '-webkit-box-sizing'],
            'border-radius': ['-moz-border-radius', '-webkit-border-radius'],
            'border-top-left-radius': ['-moz-border-radius-topleft', '-webkit-border-top-left-radius'],
            'border-top-right-radius': ['-moz-border-radius-topright', '-webkit-border-top-right-radius'],
            'border-bottom-right-radius': ['-moz-border-radius-bottomright', '-webkit-border-bottom-right-radius'],
            'transform': ['-moz-transform', '-webkit-transform', '-o-transform'],
            'transition': ['-moz-transition', '-webkit-transition', '-o-transition'],
            'column': ['-moz-column', '-webkit-column'],
            'column-count': ['-moz-column-count', '-webkit-column-count'],
            'column-gap': ['-moz-column-gap', '-webkit-column-gap'],
            'column-width': ['-moz-column-width', '-webkit-column-width'],
            'column-rule': ['-moz-column-rule', '-webkit-column-rule'],
            'column-rule-color': ['-moz-column-rule-color', '-webkit-column-rule-color'],
            'column-rule-style': ['-moz-column-rule-style', '-webkit-column-rule-style'],
            'column-rule-width': ['-moz-column-rule-width', '-webkit-column-rule-width'],
            'box-shadow': ['-moz-box-shadow', '-webkit-box-shadow',
            function IEDropShadow(selector, value) {
                var args = processor.splitVal(value);
                processor.addFilter(selector, 'progid:DXImageTransform.Microsoft.DropShadow(OffX=' + args[0] + ', OffY=' + args[1] + ', Color=\'' + args[3] + '\', Positive=\'1\')');
            }],
            'opacity': [function IEOpacity(selector, value) {
                var args = processor.splitVal(value);
                var ie = parseFloat(value * 100);
                processor.addFilter(selector, "alpha(opacity=" + ie + ")");
            }],
            'text-shadow': [function IETextShadow(selector, value) {
                var args = processor.splitVal(value),dir,x=parseFloat(args[0]),y=parseFloat(args[1]);
                if(x == 0 && y == 0) dir = null;
                if(x < 0 && y < 0) dir = 315;
                if(x < 0 && y > 0) dir = 225;
                if(x > 0 && y > 0) dir = 135;
                if(x > 0 && y < 0) dir = 45;
                if(x ==0 && y > 0) dir = 0;
                if(x ==0 && y < 0) dir = 180;                
                if(x > 0 && y == 0) dir = 90;
                if(x < 0 && y == 0) dir = 270;
                processor.addFilter(selector, 'progid:DXImageTransform.Microsoft.Shadow(Color=\''+args[3]+'\', Strength=\''+parseFloat(args[2])+'\', Direction=\''+dir+'\')')
            }]
        },
        addFilter: function(selector,filter) {
            if(!selector['filter']) selector['filter'] = '';
            if(!selector['-ms-filter']) selector['-ms-filter'] = '""';        
            filter+= ' ';
            selector['filter'] += filter;
            selector['-ms-filter'] = selector['-ms-filter'].replace(/\"$/,filter+'"')
        }
    });
    CSSParser.addProcessor('css3', processor);
})();
})(window);
/*

    Footnotes: 

    #1: The original author had intended to pre-emptively support window.media interface.
        I have fixed to reflect the actual API presented here http://www.w3.org/TR/cssom-view/#the-media-interface
        ie: window.media.query => window.media.matchMedium && CSSParser.mediumApplies => CSSParser.matchMedium


*/