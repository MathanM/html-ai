var readPsd = agPsd.readPsd;

let processFile = document.getElementById('processFile');
let fileUpload = document.getElementById('psdFile');
var prefix = "jpp";
var scale = 2;
var imgIndex = 0;
processFile.onclick = function(element) {
	psdUpload();
};
chrome.storage.local.get('psdData', function(data) {
  if(data.psdData){
  	connect(data.psdData);
  }
});
initPSD = async(imgData) => {
	//PSD PROCESSING FUNCTIONS
	const checkContainers = (loc, locArr) => {
	    for (let i = 0; i < locArr.length; i++) {
	        if (locArr[i].location > vEnd / 2) {
	            if ((vEnd - locArr[i].location) >= loc-20 && (vEnd - locArr[i].location) <= loc+20) {
	                return true;
	            }
	        }
	    }
	    return false;
	}
	const getLayers = (layer, out) => {
      layer.forEach(lay => {
          if (!lay.hidden) {
              if (lay.children && lay.children.length > 0) {
                  getLayers(lay.children, out);
              } else {
                  out.push(lay);
              }
          }
      });
  }
  const RGBToHex = (r, g, b) => {
      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);
      r = r.toString(16);
      g = g.toString(16);
      b = b.toString(16);

      if (r.length == 1)
          r = "0" + r;
      if (g.length == 1)
          g = "0" + g;
      if (b.length == 1)
          b = "0" + b;

      return "#" + r + g + b;
  }
  const dropToBoxShadow = (o,a,d,s,sp,r,g,b)=>{
      let shadow = "";
      let opacity = o;
      a = (180 - a) * 3.14 / 180;
      let offY = Math.round(Math.sin(a) * d);
      let offX = Math.round(Math.cos(a) * d);
      let spreadrad = s * sp/100;
      let blurrad = s - spreadrad;
      shadow = offX + "px " + offY + "px " + blurrad + "px " + spreadrad + "px " + "rgba("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+","+opacity+")"
      return shadow;
  }
  const roundNumbers = (num) => {
      if (num % 1 == 0) {
          return num;
      } else {
          return num.toFixed(2);
      }
  }
  const layerInheritance = (layArr) => {
      //inherit layers
      for(let j=0;j<layArr.length;j++){
          let lay = layArr[j];
          if (lay && lay.canvas) {
              for (let i = 0; i < layArr.length; i++) {

                  if (
                      lay.id != layArr[i].id &&
                      ((layArr[i].top > lay.top && layArr[i].top < lay.bottom) ||
                          (layArr[i].bottom > lay.top && layArr[i].bottom < lay.bottom)) &&
                      ((layArr[i].left > lay.left && layArr[i].left < lay.right) ||
                          (layArr[i].right > lay.left && layArr[i].right < lay.right))
                  ) {

                      if (!lay.layers) {
                          lay.layers = [];
                      }
                      var tempLayer = layArr.splice(i, 1);
                      lay.layers.push(tempLayer[0]);
                      i--;
                      j--;
                  }
              }

              if (lay.layers) {
                  lay.layers = layerInheritance(lay.layers);
              }

          }
      }
      return layArr;
  }
  const layerDepth = (layArr) => {
      // layer depth
      let d = 1;
      layArr.forEach(lay => {
          var top = lay.top;
          var bottom = lay.bottom;
          for (let i = 0; i < layArr.length; i++) {
              if (lay.id != layArr[i].id && !layArr[i].depth) {
                  if(
                      layArr[i].top >= top
                  ){
                      if(layArr[i].bottom <= bottom){
                          layArr[i].depth = d;
                          lay.depth = d;
                      }else if(layArr[i].top <= bottom){
                          bottom = layArr[i].bottom;
                          layArr[i].depth = d;
                          lay.depth = d;
                      }
                  }
              }
          }
          if (!lay.depth) {
              lay.depth = d;
          }
          d++;
          if (lay.layers) {
              lay.layers = layerDepth(lay.layers);
          }
      });
      return layArr;
  }
  const getInlineStyle = (style) =>{
	    let str = "";
	    if(style){
	        if(style.background){
	            str += "background-color: "+style.background+"; ";
	        }
	        if(style.border){
	            str += "border: "+style.border+"; ";
	        }
	        if(style.boxShadow){
	            str += "box-shadow: "+style.boxShadow+"; ";
	        }
	        if(style.paddingTop){
	            str += "padding-top: "+style.paddingTop+"; ";
	        }
	        if(style.paddingBottom){
	            str += "padding-bottom: "+style.paddingBottom+"; ";
	        }
	        if(style.fontSize){
	            str += "font-size: "+style.fontSize+"; ";
	        }
	        if(style.lineHeight){
	            str += "line-height: "+style.lineHeight+"; ";
	        }
	        if(style.color){
	            str += "color: "+style.color+"; ";
	        }
	        if(style.fontWeight){
	            str += "font-weight: "+style.fontWeight+"; ";
	        }
	        if(style.textDecoration){
	            str += "text-decoration: "+style.textDecoration+"; ";
	        }
	        if(style.textAlign){
	            str += "text-align: "+style.textAlign+"; ";
	        }
	        if(style.fontStyle){
	            str += "font-style: "+style.fontStyle+"; ";
	        }
	    }
	    return str.trim();
	}
	const getLayerCode = async(layArr, laySpace, sec, parent) => {
      var htmlCode = "";
      for (let i = 1; i <= layArr.length; i++) {
          var depthLayers = layArr.filter(lay => {
              return lay.depth == i;
          });
          if(depthLayers.length > 0){
              var layid;
              depthLayers.forEach(lay =>{
                  layid = lay.id;
                  lay.prop = getLayerStyle(lay);
              });
          }
          if (depthLayers.length == 1) {
              for(let i=0;i<depthLayers.length;i++){
                  let lay = depthLayers[i];
                  let inStyle = getInlineStyle(lay.prop);
                  if (lay.text) {
                      let font = lay.prop;

                      if(parent && parent.tag == "button"){
                          htmlCode += (font.text.replace(/\n/g, "#[br]")) + "\n";
                      }else{
                          htmlCode += laySpace + font.tag +(inStyle?'(style="'+inStyle+'")':'')+' ' + (font.text.replace(/\n/g, '#[br]')) + '\n';
                      }
                  } else {
                      if (lay.tag == "icon") {
                          htmlCode += laySpace + 'i'+(inStyle?'(style="'+inStyle+'")':'')+'\n';
                      }else if(lay.tag == "img") {
                          htmlCode += laySpace + 'img(src=`${img}img-'+imgIndex+'.png` style="'+inStyle+'")\n';
                          imgIndex++;
                      }else if(lay.tag == "button"){
                          htmlCode += laySpace + 'a.btn(href="#" style="'+inStyle+'") ';
                      }else{
                          htmlCode += laySpace + 'div'+(inStyle?'(style="'+inStyle+'")':'')+'\n';
                      }

                  }
                  if (lay.layers && lay.tag!= "icon" && lay.tag != "img") {
                      htmlCode += await getLayerCode(lay.layers, laySpace + "\t",sec,lay);
                  }
              }
          } else if(depthLayers.length > 0) {
              var ans = {"layout":""};
              if(ans.layout.indexOf("col") != -1){
                  htmlCode += laySpace + "."+prefix+"-row\n";
                  laySpace += "\t";
              }else if(ans.layout == "btn-group"){
                  htmlCode += laySpace + ".btn-group\n";
                  laySpace += "\t";
              }else if(ans.layout == "icon"){
                  htmlCode += laySpace + "i\n";
              }

              for(let i=0;i<depthLayers.length;i++){
                  let lay = depthLayers[i];
                  if(lay.text){
                      let font = lay.prop;
                      if(parent && parent.tag == "button"){
                          htmlCode += (font.text.replace(/\n/g, "#[br]")) + "\n";
                      }else{
                          htmlCode += laySpace + font.tag + " " + (font.text.replace(/\n/g, "#[br]")) + "\n";
                      }
                  }else{
                      if (lay.tag == "icon") {
                          htmlCode += laySpace + "i\n";
                      }else if(lay.tag == "img") {
                          htmlCode += laySpace + 'img(src=`${img}img-'+imgIndex+'.png`)\n';
                          imgIndex++;
                      }else if(lay.tag == "button"){
                          htmlCode += laySpace + 'a.btn(href="#") ';
                      }else{
                          if(ans.layout.indexOf("col") != -1){
                              var col = ans.layout.split("col-").join("");
                              var gridIndex = 12/col;
                              if(depthLayers.length == col){
                                  htmlCode += laySpace + '.'+prefix+'-col-'+gridIndex+'\n';
                              }
                          }else{
                              htmlCode += laySpace + 'div\n';
                          }
                      }
                  }
                  if (lay.layers && lay.tag!= "icon" && lay.tag != "img") {
                      htmlCode += await getLayerCode(lay.layers, laySpace + "\t",sec,lay);
                  }
              }
          }
      }
      return htmlCode;
  }
  const getLayerStyle = (lay) => {
      let style = {};
      if(lay.vectorFill){
          if(lay.vectorFill.type == "color"){
              style.background = RGBToHex(lay.vectorFill.color.r,lay.vectorFill.color.g,lay.vectorFill.color.b);
          }
      }
      if(lay.effects){
          if(lay.effects.stroke && lay.effects.stroke.enabled){
              if(lay.effects.stroke.fillType == "color"){
                  style.border = (lay.effects.stroke.size.value/scale)+"px solid "+RGBToHex(lay.effects.stroke.color.r,lay.effects.stroke.color.g,lay.effects.stroke.color.b);
              }
          }
          if(lay.effects.dropShadow && lay.effects.dropShadow.enabled){
              let shadow = dropToBoxShadow(
                  lay.effects.dropShadow.opacity,
                  lay.effects.dropShadow.angle,
                  lay.effects.dropShadow.distance.value,
                  lay.effects.dropShadow.size.value,
                  lay.effects.dropShadow.choke.value,
                  lay.effects.dropShadow.color.r,
                  lay.effects.dropShadow.color.g,
                  lay.effects.dropShadow.color.b
              );
              style.boxShadow = shadow;
          }
      }
      if(lay.text){
          style.tag = "p";
          style.text = lay.text.text.replace(/\n/g, "<br>");
          style.textAlign = (lay.text.paragraphStyle && lay.text.paragraphStyle.justification) ? lay.text.paragraphStyle.justification : 'left';
          if(lay.text.style){
              if(lay.text.style.fontSize){
                  let size = roundNumbers(Math.round(lay.text.style.fontSize * lay.text.transform[3] * 100)*0.01 / scale);
                  style.fontSize = size + "px";
                  if (size < 20) {
                      style.tag = "p";
                  } else if (size < 30) {
                      style.tag = "h4";
                  } else if (size < 35) {
                      style.tag = "h3";
                  } else if (size < 40) {
                      style.tag = "h2";
                  } else {
                      style.tag = "h1";
                  }
              }
              if(lay.text.style.leading){
                  style.lineHeight = roundNumbers(Math.round(lay.text.style.leading* lay.text.transform[3] * 100)*0.01 / scale) + "px";
              }
              if(lay.text.style.fillColor){
                  style.color = RGBToHex(lay.text.style.fillColor.r, lay.text.style.fillColor.g, lay.text.style.fillColor.b);
              }
              if(lay.text.style.font){
                  style.fontFamily = lay.text.style.font.name;
                  if (style.fontFamily.toLowerCase().indexOf("bold") != -1) {
                      style.fontWeight = "bold";
                  } else if (style.fontFamily.toLowerCase().indexOf("semibold") != -1 || style.fontFamily.toLowerCase().indexOf("semi-bold") != -1) {
                      style.fontWeight = "600";
                  } else if (style.fontFamily.toLowerCase().indexOf("medium") != -1) {
                      style.fontWeight = "500";
                  } else if (style.fontFamily.toLowerCase().indexOf("regular") != -1) {
                      style.fontWeight = "normal";
                  } else if (style.fontFamily.toLowerCase().indexOf("light") != -1) {
                      style.fontWeight = "200";
                  }
              }
              if(lay.text.style.underline){
                  style.textDecoration = "underline";
              }
              if(lay.text.style.fauxItalic){
                  style.fontStyle = "italic";
              }
          }
          if(lay.text.styleRuns){

              var formattedText = "";
              var start = 0;
              lay.text.styleRuns.forEach(run=>{
                  run.startIndex = start;
                  run.text = lay.text.text.substr(start,run.length);
                  start += run.length;
                  run.prop = {};
                  if (run.style.fontSize) {
                      let size = roundNumbers(Math.round(run.style.fontSize * lay.text.transform[3] * 100)*0.01 / scale);
                      run.prop.fontSize = size + "px";
                      run.prop.tag = "span";
                  }
                  if(run.style.font){
                      run.prop.fontFamily = run.style.font.name;
                      if (run.prop.fontFamily.toLowerCase().indexOf("bold") != -1) {
                          run.prop.fontWeight = "bold";
                          run.prop.tag = "strong";
                      } else if (run.prop.fontFamily.toLowerCase().indexOf("semibold") != -1 || run.prop.fontFamily.toLowerCase().indexOf("semi-bold") != -1) {
                          run.prop.fontWeight = "600";
                      } else if (run.prop.fontFamily.toLowerCase().indexOf("medium") != -1) {
                          run.prop.fontWeight = "500";
                      } else if (run.prop.fontFamily.toLowerCase().indexOf("regular") != -1) {
                          run.prop.fontWeight = "normal";
                      } else if (run.prop.fontFamily.toLowerCase().indexOf("light") != -1) {
                          run.prop.fontWeight = "200";
                      }
                  }
                  if(run.style.underline){
                      run.prop.textDecoration = "underline";
                      run.prop.tag = "a";
                  }
                  if(run.style.fauxItalic){
                      run.prop.fontStyle = "italic";
                  }
                  if (run.style.fillColor){
                      run.prop.color = RGBToHex(run.style.fillColor.r, run.style.fillColor.g, run.style.fillColor.b);
                      if(run.prop.color != "#000000" && run.prop.color != "#333333"){
                          run.prop.tag = "a";
                      }
                  }
                  let inlineStyle = getInlineStyle(run.prop);
                  if(run.prop.tag){
                      formattedText += '<'+run.prop.tag+' style="'+inlineStyle+'"'+'>'+run.text+'</'+run.prop.tag+'>';
                  }else if(inlineStyle!=""){
                      formattedText += '<span style="'+inlineStyle+'"'+'>'+run.text+'</span>';
                  }else{
                      formattedText += run.text;
                  }
              });
              style.text = formattedText.replace(/\n/g, "<br>");
          }
      }
      if(lay.canvas && typeof lay.canvas.toDataURL == "function"){
        style.img = lay.canvas.toDataURL('image/png', 1.0);
      }
      style.predictionTag = getWireframe(lay);
      return style;
  }
  const checkForImg = (layArr) => {
      var flag = false;
      for(let i=0;i<layArr.length;i++){
          if(layArr[i].text){
              flag = true;
              break;
          }
          if(layArr[i].layers){
              var temp = checkForImg(layArr[i].layers);
              if(temp){
                  flag = temp;
                  break;
              }
          }
      }
      return flag;
  }
  const getWireframe = (lay) =>{
      let tag = "";
      if(lay.text){
        tag = "text";
      }else if(lay.canvas){
          if (lay.canvas.width < 600 && lay.canvas.height < 500) {
              if(lay.layers && lay.layers.length > 0){
                  if(lay.layers.length == 1 && lay.layers[0].text && lay.layers[0].left > lay.left && lay.layers[0].right < lay.right && lay.layers[0].top > lay.top && lay.layers[0].bottom < lay.bottom){
                      tag = "button";
                  }else{
                    var imgFlag = checkForImg(lay.layers);
                    if(imgFlag){
                        tag = "card";
                    }else{
                        tag = "icon";
                    }
                  }
              }else{
                tag = "icon";
              }
          }else{
              if(vContainers.length > 0 && lay.left >= (vContainers[0].offset*scale-10)){
                  if(lay.layers && lay.layers.length > 0){
                      if(lay.layers.length == 1 && lay.layers[0].text && lay.layers[0].left > lay.left && lay.layers[0].right < lay.right && lay.layers[0].top > lay.top && lay.layers[0].bottom < lay.bottom){
                          tag = "button";
                      }else{
                          var imgFlag = checkForImg(lay.layers);
                          if(imgFlag){
                              tag = "card";
                          }else{
                              tag = "img";
                          }
                      }
                  }else{
                      tag = "img";
                  }
              }
          }
      }
      return tag;
      // if(lay.layers && lay.layers.length > 0 && !depth){
      //     lay.layers.forEach(sublay=>{
      //         getWireframe(sublay);
      //     });
      // }
  }
	// Sections
  var hInit = 0;
  var hEnd = imgData.height;
  var hSec = [];
  var limitOffset = 2;
  var hGuides = imgData.imageResources.gridAndGuidesInformation.guides.filter(g => {
      return (g.direction == "horizontal" && g.location >= hInit-limitOffset && g.location <= hEnd+limitOffset);
  }).sort((a, b) => {
      let s = 0;
      if (a.location > b.location) {
          s = 1;
      } else if (a.location < b.location) {
          s = -1;
      }
      return s;
  });
  for (let i = 0; i < hGuides.length - 1; i++) {
      hSec.push({section:"section",class: "sec-" + (i + 1), top: hGuides[i].location, bottom: hGuides[i + 1].location, layers: [], prop:{}});
  }
  // get containers
  var vInit = 0;
  var vEnd = imgData.width;
  var vContainers = [];
  var vGuides = imgData.imageResources.gridAndGuidesInformation.guides.filter(g => {
      return (g.direction == "vertical" && g.location > vInit && g.location < vEnd);
  }).sort((a, b) => {
      let s = 0;
      if (a.location > b.location) {
          s = 1;
      } else if (a.location < b.location) {
          s = -1;
      }
      return s;
  });
  var vCss = "";
  vGuides.forEach(data => {
      var index = 0;
      if (data.location < vEnd / 2) {
          var c = checkContainers(data.location, vGuides);
          if (c) {
              index++;
              vCss += "." + prefix + "-body-pane ." + prefix + "-container-" + index + "{.page-container(" + (data.location / scale) + "px);}\n\n";
              vContainers.push({class: prefix + "-container-" + index, offset: (data.location / scale)});
          }
      }
  });
  if(vContainers.length == 0){
      if(vGuides.length > 0){
          vCss += "." + prefix + "-body-pane ." + prefix + "-container-" + 1 + "{.page-container(" + (vGuides[0].location / scale) + "px);}\n\n";
          vContainers.push({class: prefix + "-container-" + 1, offset: (vGuides[0].location / scale)});
      }
  }
  // get layer style
  var textSizeArr = [];
  var psdLayers = imgData.children;
  var layers = [];
  if (Array.isArray(psdLayers)) {
    getLayers(psdLayers, layers);
    var imgLayers = [];
    var filterLayers = [];
    var textLayers = [];
    layers.forEach(lay => {
        if (lay.text) {
            if(lay.text.style && lay.text.style.fontSize){
                textSizeArr.push(parseFloat(roundNumbers(lay.text.style.fontSize * lay.text.transform[0])));
            }
            textLayers.push(lay);
        } else {
            if (lay.canvas) {
                if (lay.canvas.width < 600 && lay.canvas.height < 500) {
                    filterLayers.push(lay);
                } else {
                    //imgLayers.push(lay.canvas.toBuffer());
                }
            }
        }
        hSec.forEach(sec => {
            if (lay.top >= sec.top && lay.bottom <= sec.bottom) {
                sec.layers.push(lay);
            }else if(lay.top >= sec.top - limitOffset && lay.bottom <= sec.bottom + limitOffset){
                Object.assign(sec.prop, getLayerStyle(lay));
            }
        });
    });
    textSizeArr = [...new Set(textSizeArr)].sort(function(a, b){return b-a});

    var pugCode = "";

    for(let i=0;i<hSec.length;i++){
        let sec = hSec[i];
        //sort layers
        sec.layers = sec.layers.sort((a, b) => {
            let s = 0;
            if (a.top > b.top) {
                s = 1;
            } else if (a.top < b.top) {
                s = -1;
            }
            return s;
        });
        //choose container
        vContainers.forEach(con => {
            let flag = true;
            for (let i = 0; i < sec.layers.length; i++) {
                if (!(sec.layers[i].left >= (con.offset * scale) - 2)) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                sec.container = con;
            }
        });
        sec.layers = layerInheritance(sec.layers);
        sec.layers = layerDepth(sec.layers);

        //generate sec wireframe
        // sec.layers.forEach(lay=>{
        //     getWireframe(lay);
        // });
        //get sec paddings
        if(sec.layers.length > 0){
            sec.prop.paddingTop = Math.round((sec.layers[0].top - (sec.top?sec.top:0)) / scale)+"px";
            sec.prop.paddingBottom = Math.round((sec.bottom - sec.layers[sec.layers.length - 1].bottom) / scale)+"px";
        }

        //generate code
        var htmlCode = "." + sec.class + '(style="'+getInlineStyle(sec.prop)+'")' +"\n";
        if(sec.container){
            htmlCode += "\t." + sec.container.class + "\n";
        }

        htmlCode += await getLayerCode(sec.layers, "\t\t",sec);
        //console.log(htmlCode);


        sec.code = htmlCode;
        pugCode += sec.code;
    }
    chrome.storage.local.set({psdData: hSec}, function() {});
	  connect(hSec);
  }
}
connect = function(data) {
  console.log(data);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const port = chrome.tabs.connect(tabs[0].id);
    port.postMessage({ layerData: data });
    port.onMessage.addListener((response) => {
      console.log(response);
    });
  });
}
psdUpload = function(){
	var reader  = new FileReader();
	var file    = fileUpload.files[0];
	reader.addEventListener("load",function(){
    const buffer = reader.result;
    var psd = readPsd(buffer,{
        skipLayerImageData: false,
        skipCompositeImageData: false,
        skipThumbnail: true
    });
    console.log(psd);
    initPSD(psd);
  }, false);
	if(file){
    reader.readAsArrayBuffer(file);
  }
};