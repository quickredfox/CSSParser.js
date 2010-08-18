
  // uses the parsed css to apply useful jQuery functions
  $.parsecss.jquery = function(css) {
      for (var selector in css) {
          for (var property in css[selector]) {
              var match = /^-jquery(-(.*))?/.exec(property);
              if (!match) continue;
              var value = munge(css[selector][property]).split('!');
              // exclamation point separates the parts of livequery actions
              var which = match[2];
              dojQuery(selector, which, restore(value[0]), restore(value[1]));
          }
      }
  };
function dojQuery(selector, which, value, value2) {
      // value2 is the value for the livequery no longer match
      if (/show|hide/.test(which)) which += 'Default';
      // -jquery-show is a shortcut for -jquery-showDefault
      if (value2 !== undefined && $.livequery) {
          // mode is 0 for a static value (can be evaluated when parsed);
          // 1 for delayed (refers to "this" which means it needs to be evaluated separately for each element matched), and
          // 2 for livequery; evaluated whenever elments change
          var mode = 2;
      } else {
          mode = /\bthis\b/.test(value) ? 1: 0;
      }
      if (which && $.fn[which]) {
          // a plugin
          // late bind parseArguments so "this" is defined correctly
          function p(str) {
              return function() {
                  return $.fn[which].apply($(this), $.parsecss.parseArguments.call(this, str))
              }
          };
          switch (mode) {
          case 0:
              return $.fn[which].apply($(selector), $.parsecss.parseArguments(value));
          case 1:
              return $(selector).each(p(value));
          case 2:
              return (new $.livequery(selector, document, undefined, p(value), value2 === '' ? undefined: p(value2))).run();
          }
      } else if (which) {
          // a plugin but one that was not defined
          return undefined;
      } else {
          // straight javascript
          switch (mode) {
          case 0:
              return eval(value);
          case 1:
              return $(selector).each(Function(value));
          case 2:
              return (new $.livequery(selector, document, undefined, Function(value), value2 === '' ? undefined: Function(value2))).run();
          }
      }
  }
  
  // override show and hide. $.data(el, 'showDefault') is a function that is to be used for show if no arguments are passed in (if there are arguments, they override the stored function)
  // Many of the effects call the native show/hide() with no arguments, resulting in an infinite loop.
  var _show = {
      show: $.fn.show,
      hide: $.fn.hide
  };
  // save the originals
  $.each(['show', 'hide'],
  function() {
      var which = this,
      show = _show[which],
      plugin = which + 'Default';
      $.fn[which] = function() {
          if (arguments.length > 0) return show.apply(this, arguments);
          return this.each(function() {
              var fn = $.data(this, plugin),
              $this = $(this);
              if (fn) {
                  $.removeData(this, plugin);
                  // prevent the infinite loop
                  fn.call($this);
                  $this.queue(function() {
                      $this.data(plugin, fn).dequeue()
                  });
                  // put the function back at the end of the animation
              } else {
                  show.call($this);
              }
          });
      };
      $.fn[plugin] = function() {
          var args = $.makeArray(arguments),
          name = args[0];
          if ($.fn[name]) {
              // a plugin
              args.shift();
              var fn = $.fn[name];
          } else if ($.effects && $.effects[name]) {
              // a jQuery UI effect. They require an options object as the second argument
              if (typeof args[1] != 'object') args.splice(1, 0, {});
              fn = _show[which];
          } else {
              // regular show/hide
              fn = _show[which];
          }
          return this.data(plugin,
          function() {
              fn.apply(this, args)
          });
      };
  });