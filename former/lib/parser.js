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

