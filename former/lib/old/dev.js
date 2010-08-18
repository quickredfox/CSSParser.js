cssfn = {
	matchRgba: /^rgba\s{0,}\(\s{0,}(\d+)\s{0,},\s{0,}(\d+)\s{0,},\s{0,}(\d+)\s{0,},\s{0,}(\d+)\s{0,}\)/,
	matchHexa: /^#{0,}([A-f0-9]{2,2})([A-f0-9]{2,2})([A-f0-9]{2,2})([A-f0-9]{2,2})/,
	matchShortHex: /^#{0,}([A-f0-9])([A-f0-9])([A-f0-9])$/,
	matchLongHex: /#{0,}([A-f0-9])\1([A-f0-9])\2([A-f0-9])\3$/,
	basicImageToDeg: function (d) {
		return (d * 90) || 0;
	},
	degToBasicImage: function (d) {
		return Math.round(((d / 90) || 0) * 100) / 100;
	},
	decimalToHex: function (d) {
		return ('0' + parseInt(d, 10).toString(16)).substr(-2).toUpperCase();
	},
	hexToDecimal: function (d) {
		return parseInt(d, 16);
	},
	longHex: function (h) {
		return (h.toUpperCase().match(this.matchShortHex)) ? h.toUpperCase().replace(this.matchShortHex, '#$1$1$2$2$3$3') : h.toUpperCase();
	},
	shortHex: function (h) {
		return (h.toUpperCase().match(this.matchLongHex)) ? h.toUpperCase().replace(this.matchLongHex, '#$1$2$3').toUpperCase() : h.toUpperCase();
	},
	rgbaToHexa: function (c) {
		var i = 0,
		h = '#',
		m = ((c = c.toLowerCase().match(this.matchRgba)) !== null) ? c : [null, 0, 0, 0, 0];
 
		while (++i < 5) {
			h += this.decimalToHex(m[i]);
		}
 
		return h.toUpperCase();
	},
	hexaToRgba: function (c) {
		var i = 0,
		h = [],
		m = ((c = c.toUpperCase().match(this.matchHexa)) !== null) ? c : [null, '00', '00', '00', '00'];
 
		while (++i < 5) {
			h.push(this.hexToDecimal(m[i]));
		}
 
		return 'rgba(' + h.join(', ') + ')';
	}
};
var addFilter = function(selector,filter) {
    if(!selector['filter']) selector['filter'] = '';
    if(!selector['-ms-filter']) selector['-ms-filter'] = '""';        
    filter = filter + ' ';
    selector['filter'] += filter;
    selector['-ms-filter'] = selector['-ms-filter'].replace(/\"$/,filter+'"')
}

$.extend(CSSParser.parse,{
    // equivChart = {
    //     'border-radius': [[moz,webkit]]
    // }
    fixers: {
    	'border-radius': [ '-moz-border-radius', '-webkit-border-radius' ],
    	'border-top-left-radius': [ '-moz-border-radius-topleft', '-webkit-border-top-left-radius' ],		
    	'border-top-right-radius': [ '-moz-border-radius-topright', '-webkit-border-top-right-radius' ],				
    	'border-bottom-right-radius': [ '-moz-border-radius-bottomright', '-webkit-border-bottom-right-radius' ],
    	'transform': ['-moz-transform','-webkit-transform','-o-transform'],
    	'transition': ['-moz-transition','-webkit-transition','-o-transition'],
    	'column':['-moz-column','-webkit-column'],    	
    	'column-count':['-moz-column-count','-webkit-column-count'],
    	'column-gap': ['-moz-column-gap','-webkit-column-gap'],
	    'column-width': ['-moz-column-width','-webkit-column-width'],
	    'column-rule': ['-moz-column-rule','-webkit-column-rule'],	    
	    'column-rule-color': ['-moz-column-rule-color','-webkit-column-rule-color'],	    
	    'column-rule-style': ['-moz-column-rule-style','-webkit-column-rule-style'],	    
	    'column-rule-width': ['-moz-column-rule-width','-webkit-column-rule-width'],
	    'box-shadow': ['-moz-box-shadow','-webkit-box-shadow',function IEDropShadow(selector,value) {
    	    var args = $.map(value.split(' '),$.trim);
    	    addFilter(selector,"progid:DXImageTransform.Microsoft.dropshadow(OffX="+args[0]+", OffY="+args[1]+", Color='"+args[3]+"')");
    	}],
    	'opacity': [function IEOpacity(selector,value) {
    	    var args = $.map(value.split(' '),$.trim);
    	    var ie = parseFloat(value*100);
    	    addFilter(selector,"alpha(opacity="+ie+")");    	    
    	}], 
    	'text-shadow': [function IETextShadow(selector,value) {
    	    var args = $.map(value.split(' '),$.trim);
    	    addFilter(selector,'dropshadow(color='+args[2]+', offx='+args[0]+', offy='+args[1]+')')
    	}],
    	'box-sizing': ['-moz-box-sizing','-webkit-box-sizing']
    },
    css3: function(css) {
        var enhanced = {};
        $.each(css,function(selector,properties) {
            $.each(properties,function(property,value) {
                var equivalents = CSSParser.parse.fixers[property]
                if(equivalents){
                    enhanced[selector] = enhanced[selector]||{};
                    $.each(equivalents,function(i,equiv) {
                        if($.isFunction(equiv)) equiv(enhanced[selector],value)
                        else enhanced[selector][equiv] = value;
                    })
                }
            })
        });
		CSSParser.addCSS(enhanced);
        return enhanced;
    }
});

$(function() {
    console.debug(CSSParser.parse("#demo{border-radius:1em;box-shadow:2px 2px 3px #000}"))
})