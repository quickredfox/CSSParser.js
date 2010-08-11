#!/usr/bin/env ruby
require 'ftools'
require 'fssm'
LIB_PATH = File.join(File.dirname(__FILE__), 'lib')
BUILD_PATH = File.join(File.dirname(__FILE__), 'build')
WARN = "/////////////// DO NOT EDIT, FILE IS GENERATED ///////////////\n\n"
HEADER = File.read(File.join(LIB_PATH,'HEADER'))
FOOTER = File.read(File.join(LIB_PATH,'FOOTER'))    


class CSSPARSERTasks
  def initialize
    @merged = []
    @compressed = ''
  end
  def build
    puts "building..."
    @busy = true
    @merged = []
    @compressed = ''
    make_build_dirs
    merge_scripts
    make_compressed
    make_files
    puts "...done!"    
  end
  def watch
    FSSM.monitor(LIB_PATH, '*.js') do
      update {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
      delete {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
      create {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
    end
     FSSM.monitor(LIB_PATH,'processors', '*.js') do
        update {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
        delete {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
        create {|base, relative| CSSPARSER.build unless relative == 'CSSparser.js'}
      end
  end
  
  private
  def merge_scripts    
    @merged << File.read(File.join(LIB_PATH,'parser.js'))
    @merged << File.read(File.join(LIB_PATH,'processors','generic.js'))    
    @merged << File.read(File.join(LIB_PATH,'processors','css3.js'))
    @merged = "#{WARN}#{HEADER}\n(function(window,undefined){\n#{@merged.join("\n").strip}\n})(window);\n#{FOOTER}"
  end
  def make_compressed
    require "yui/compressor"
    compressor = YUI::JavaScriptCompressor.new
    @compressed = compressor.compress(@merged)
  end
  def make_files
    File.open(File.join(LIB_PATH,'CSSparser.js'),'w') do |f|
      f.write(@merged)
    end
    File.open(File.join(BUILD_PATH,'CSSparser.js'), 'w') do |f|
      f.write(@merged)
    end
    File.open(File.join(BUILD_PATH,'CSSparser-compressed.js'), 'w') do |f| 
      f.write(@compressed)
    end
   
  end
  def make_build_dirs
      File.makedirs(BUILD_PATH)
  end
end
CSSPARSER = CSSPARSERTasks.new
desc "Build the necessary files"
task :build do 
  CSSPARSER.build
end

desc "Watch the lib dir and regenerate as it changes"
task :watch do  
  CSSPARSER.watch
end
