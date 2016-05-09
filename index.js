var fs = require('fs')
var async = require('async')
var shortId = require('shortid')
var gerberToSvg = require('gerber-to-svg')
var whatsThatGerber = require('whats-that-gerber')
var stackupProcess = require('pcb-stackup')

var gerberPaths = [
  'gerbers/BusPirate-v3.6-SSOP.cmp',
  'gerbers/BusPirate-v3.6-SSOP.gko',
  'gerbers/BusPirate-v3.6-SSOP.sol',
  'gerbers/BusPirate-v3.6-SSOP.drd',
  'gerbers/BusPirate-v3.6-SSOP.gpi',
  'gerbers/BusPirate-v3.6-SSOP.stc',
  'gerbers/BusPirate-v3.6-SSOP.dri',
  'gerbers/BusPirate-v3.6-SSOP.plc',
  'gerbers/BusPirate-v3.6-SSOP.sts'
]

var processLayer = function (layer) {
  if (layer.layerType == null) {
    layer.layerType = whatsThatGerber(layer.filename).id
  }
  layer.gerber = gerberToSvg(gerber, converterOptions, function(error, result) {
    if (error) {
      console.warn(' failed to convert')
    }
  });
}

var pcbStackup = function (layers, optionsOrCallback, callback) {
  var options;
  if (typeof optionsOrCallback === 'object') {
    options = optionsOrCallback;
  } else if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
  }
  console.log('options', options);
  console.log('callback', callback);
}

// asynchronously map a gerber filename to a layer object expected by stackupProcess
var mapFilenameToLayerObject = function(filename, done) {
  var gerber = fs.createReadStream(filename, 'utf-8')
  var type = whatsThatGerber(filename)
  var converterOptions = {
    id: shortId.generate(),
    plotAsOutline: type.id === 'out'
  }

  var converter = gerberToSvg(gerber, converterOptions, function(error, result) {
    if (error) {
      console.warn(filename + ' failed to convert')
      return done()
    }

    done(null, {type: type, converter: converter})
  })
}

// pass an array of layer objects to stackupProcess and write the stackup results
var handleLayers = function(error, layers) {
  if (error) {
    return console.error('error mapping gerber file paths to array of converters')
  }

  var stackup = stackupProcess(layers.filter(Boolean), {id: 'my-board', maskWithOutline: true})
  fs.writeFileSync('top.svg', stackup.top)
  fs.writeFileSync('bottom.svg', stackup.bottom)
}

// map the gerber files to layer objects, then pass them to stackupProcess
async.map(gerberPaths, mapFilenameToLayerObject, handleLayers)
