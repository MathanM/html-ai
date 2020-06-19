var dragObj;
var pad = true;
var extData;
var xhr = new XMLHttpRequest();
var shiftHandles = [];
xhr.open("GET", chrome.extension.getURL('/html-ai.json'), true);
xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
    extData = JSON.parse(xhr.responseText);
  }
}
xhr.send();
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    var layerData = msg.layerData;
    console.log(layerData);
    console.log(extData)
    if($(".html-editor-component").length > 0){
    	$(".html-editor-component").remove();
    }
    var editor = $("<div/>").addClass("html-editor-component");
    var elContainer = $("<div/>").addClass("element-container");
    var selContainer = $("<div/>").addClass("selected-container");
    var calContainer = $("<div/>").addClass("class-container");
    dropItem();
    for(let i=0;i<layerData.length;i++){
    	var lay = layerData[i];
    	var layCont = $("<div/>").addClass("lay-container");
    	var item = $("<div/>").addClass("sec-ele").attr("draggable","true").data("lay",lay).text(lay.class);
    	dragItem(item);
    	layCont.append(item);
    	layCont = createTagElements(lay,layCont);
    	elContainer.append(layCont);
    }
    editor.append(elContainer);
    let selOpt = "";
    extData.selectBox.forEach((val)=>{
    	selOpt += '<option value="'+val.key+'">'+val.text+'</option>';
    });
    selContainer.append(`
	<div class="prop-box-sec">
		<div class="pad-box prop-box active">P</div>
		<div class="mar-box prop-box">M</div>
		<div class="out-box prop-box">O</div>
		<div class="del-box prop-box">&times;</div>
		<div class="sel-box prop-box">
			<select>
			${selOpt}
			</select>
		</div>
	</div>
	<div class="ele-box-sec">
	</div>
    `);
    editor.append(selContainer);
    editor.append(calContainer);
    $("body").append(editor);
    addBasicEvents();
  });
});
addStyleSheet = function(){
	var style = document.createElement("style");
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	return style.sheet;
}
var sheet = addStyleSheet();
addCSSRule = function(sheet, selector, rules, index) {
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	}
	else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
	addCSSChildRule(selector);
	const observer = new MutationObserver((mut,ob)=>{
		for(let u of mut) {
			if (u.type == 'attributes' && u.attributeName == "style" && $(u.target).hasClass("selected-element")) {
				var par = $(u.target).parents(selector);
				let tempSelArr=[];
				for(let i=0;i<par.length;i++){
					let tempCl = "";
					par[i].classList.forEach((cl)=>{
						tempCl += "."+cl;
					});
					tempSelArr.push((par[i].localName != "div"?par[i].localName:"") + (tempCl=="" && par[i].localName == "div"?"div":tempCl));
				}
				let tempSel = tempSelArr.reverse().join(" ");
				let tempCurCl = "";
				u.target.classList.forEach((cl)=>{
					if(cl != "selected-element"){
						tempCurCl += "."+cl;
					}
				});
				let curSel = (u.target.localName != "div"?u.target.localName:"") + (tempCurCl=="" && u.target.localName == "div"?"div":tempCurCl)
				sheet.insertRule((tempSel!=""?" "+tempSel:"") + " " + curSel + "{" + $(u.target).attr("style") + "}", sheet.cssRules.length);
			}
		}
	});
	observer.observe($(selector)[0], { attributes: true, childList: true, subtree: true });
}
addCSSChildRule = function(selector){
	let el = $(selector)[0];
	if(el.children.length > 0){
		for(let i=0;i<el.children.length;i++){
			let c = el.children[i];
			if(!(c.classList.contains("e-handle") || c.classList.contains("e-bar"))){
				let tempCl = "";
				c.classList.forEach((cl)=>{
					tempCl += "."+cl;
				});
				let cSelector = selector + " " + (c.localName != "div"?c.localName:"") + (tempCl=="" && c.localName == "div"?"div":tempCl);
				if("insertRule" in sheet) {
					sheet.insertRule(cSelector + "{" + $(c).attr("style") + "}", sheet.cssRules.length);
				}
				else if("addRule" in sheet) {
					sheet.addRule(selector, rules, sheet.cssRules.length);
				}
				if(c.children.length > 0){
					addCSSChildRule(cSelector);
				}
			}
		}
	}

}
addBasicEvents = function(){

	//Editor btns click functionality
	$(document).on("click",".html-editor-component .pad-box",function(){
		$(".html-editor-component .prop-box").removeClass("active");
		$(this).addClass("active");
		pad = true;
		var selEl = $(".selected-element");
		selEl.find(".e-handle").removeClass("mar").addClass("pad");
		if(selEl.length > 0){
			let temp = parseInt(selEl.css("padding-top"),10);
			selEl.find(".t-hand").css("top",temp?temp:0);
			temp = parseInt(selEl.css("padding-bottom"),10);
			selEl.find(".b-hand").css("bottom",temp?temp:0);
			temp = parseInt(selEl.css("padding-left"),10);
			selEl.find(".l-hand").css("left",temp?temp:0);
			temp = parseInt(selEl.css("padding-right"),10);
			selEl.find(".r-hand").css("right",temp?temp:0);
		}
	});
	$(document).on("click",".html-editor-component .mar-box",function(){
		$(".html-editor-component .prop-box").removeClass("active");
		$(this).addClass("active");
		pad = false;
		var selEl = $(".selected-element");
		selEl.find(".e-handle").removeClass("pad").addClass("mar");
		if(selEl.length > 0){
			let temp = parseInt(selEl.css("margin-top"),10)*-1;
			selEl.find(".t-hand").css("top",temp!=NaN?temp:0);
			temp = parseInt(selEl.css("margin-bottom"),10)*-1;
			selEl.find(".b-hand").css("bottom",temp!=NaN?temp:0);
			temp = parseInt(selEl.css("margin-left"),10)*-1;
			selEl.find(".l-hand").css("left",temp!=NaN?temp:0);
			temp = parseInt(selEl.css("margin-right"),10)*-1;
			selEl.find(".r-hand").css("right",temp!=NaN?temp:0);
		}
	});
	$(document).on("click",".html-editor-component .out-box",function(){
		var out = "",less = "";
		out = getPugCode($("body main"),'');
		less = getLessCode($("body main"),'');
		console.log(out);
		console.log(less);
	});
	$(document).on("click",".html-editor-component .del-box",function(){
		$(".selected-element").remove();
	});
	$(document).on("change",".html-editor-component .sel-box",function(){
		let val = $(this).find("select").val();
		$(".ele-box-sec").empty();

		let selVal = extData.selectBox.filter((a)=>{
			return a.key == val;
		});
		selVal[0].components.forEach((val)=>{
			let el = $("<div/>").addClass("cus-ele").addClass("cus-"+val.lay).attr("draggable","true").text(val.displayName).data("lay",val.lay).data("lay-obj",val);
			if(val.style){
				el.addClass("cus-style");
			}else if(val.class){
				el.addClass("cus-class");
			}
			if(val.editable){
				el.attr("contenteditable","true");
			}
			$(".ele-box-sec").append(el);
		});
	});

	// Handle Knob drag functionality
	let dragKnob = false;
	let initX = 0;
	let initY = 0;
	let currX = 0;
	let currY = 0;
	let knobPos = 0;
	var knob;

	$(document).on('touchstart mousedown','.selected-element .e-handle',function(e){
		e.preventDefault();
		dragKnob = true;
		let pos = evePos(e);
		initX = pos[0];initY = pos[1];
		knob = $(this);
		knob.addClass("active");
		if(knob.hasClass("b-hand")){
			let temp = 0;
			if(pad){
				temp = parseInt($(".selected-element").css("padding-bottom"),10);
			}else{
				temp = parseInt($(".selected-element").css("margin-bottom"),10)*-1;
			}
			knobPos = temp != NaN?temp:0;
			knob.css("bottom",knobPos);
		}else if(knob.hasClass("t-hand")){
			let temp = 0;
			if(pad){
				temp = parseInt($(".selected-element").css("padding-top"),10);
			}else{
				temp = parseInt($(".selected-element").css("margin-top"),10)*-1;
			}
			knobPos = temp != NaN?temp:0;
			knob.css("top",knobPos);
		}else if(knob.hasClass("l-hand")){
			let temp = 0;
			if(pad){
				temp = parseInt($(".selected-element").css("padding-left"),10);
			}else{
				temp = parseInt($(".selected-element").css("margin-left"),10)*-1;
			}
			knobPos = temp != NaN?temp:0;
			knob.css("left",knobPos);
		}else if(knob.hasClass("r-hand")){
			let temp = 0;
			if(pad){
				temp = parseInt($(".selected-element").css("padding-right"),10);
			}else{
				temp = parseInt($(".selected-element").css("margin-right"),10)*-1;
			}
			knobPos = temp != NaN?temp:0;
			knob.css("right",knobPos);
		}
	});
	$(document).on('touchmove mousemove','body',function(e){
		if(dragKnob && $(".selected-element").length > 0){
			e.preventDefault();
			el = $(".selected-element");
			let pos = evePos(e);
			currX = pos[0];currY = pos[1];
			let val = 0;
			if(knob.hasClass("b-hand")){
				val = knobPos + initY - currY;
				knob.css("bottom",val);
				if(pad){
					el.css("padding-bottom",val+"px");
				}else{
					el.css("margin-bottom",val*-1+"px");
				}
			}

			if(knob.hasClass("t-hand")){
				val = knobPos + ((initY - currY) * -1);
				knob.css("top",val);
				if(pad){
					el.css("padding-top",val+"px");
				}else{
					el.css("margin-top",val*-1+"px");
				}
			}

			if(knob.hasClass("l-hand")){
				val = knobPos + ((initX - currX) * -1);
				knob.css("left",val);
				if(pad){
					el.css("padding-left",val+"px");
				}else{
					el.css("margin-left",val*-1+"px");
				}
			}

			if(knob.hasClass("r-hand")){
				val = knobPos + initX - currX;
				knob.css("right",val);
				if(pad){
					el.css("padding-right",val+"px");
				}else{
					el.css("margin-right",val*-1+"px");
				}
			}
			if($(".selected-element > .e-handle.active").length > 1){
				$(".selected-element > .e-handle.active").each((i,k)=>{
					if(k.className != knob[0].className){
						let kb = $(k);
						if(kb.hasClass("b-hand")){
							kb.css("bottom",val);
							if(pad){
								el.css("padding-bottom",val+"px");
							}else{
								el.css("margin-bottom",val*-1+"px");
							}
						}
						if(kb.hasClass("t-hand")){
							kb.css("top",val);
							if(pad){
								el.css("padding-top",val+"px");
							}else{
								el.css("margin-top",val*-1+"px");
							}
						}
						if(kb.hasClass("l-hand")){
							kb.css("left",val);
							if(pad){
								el.css("padding-left",val+"px");
							}else{
								el.css("margin-left",val*-1+"px");
							}
						}
						if(kb.hasClass("r-hand")){
							kb.css("right",val);
							if(pad){
								el.css("padding-right",val+"px");
							}else{
								el.css("margin-right",val*-1+"px");
							}
						}
					}
				});
			}

		}
	});
	$(document).on('touchend mouseup','.selected-element > .e-handle,body',function(e){
		dragKnob = false;
		initX = 0;
		initY = 0;

		if(knob && !e.shiftKey){
			knob.removeClass("active");
		}
	});

	// Handle Bar drag functionality
	let dragBar = false;
	let BarPos = 0;
	let initBX = 0;
	let initBY = 0;
	let currBX = 0;
	let currBY = 0;
	$(document).on('touchstart mousedown','.selected-element > .e-bar',function(e){
		el = $(".selected-element");
		dragBar = true;
		BarPos = el.outerWidth();
		let pos = evePos(e);
		initBX = pos[0];initBY = pos[1];
	});
	$(document).on('touchmove mousemove','body',function(e){
		if(dragBar && $(".selected-element").length > 0){
			e.preventDefault();
			el = $(".selected-element");
			let pos = evePos(e);
			currBX = pos[0];currBY = pos[1];

			let val = BarPos - initBX + currBX;
			el.css("width",val+"px");
		}
	});
	$(document).on('touchend mouseup','.selected-element > .e-bar,body',function(e){
		dragBar = false;
		initBX = 0;
		initBY = 0;
	});
}
createTagElements = function(lay,layCont){
	if(lay.layers && lay.layers.length > 0){
		var itemCont = $("<div/>").addClass("item-container");
		for(let i=0;i<lay.layers.length;i++){
			var item;
			if(lay.layers[i].text){
				item = $("<div/>").addClass("txt-ele").attr("draggable","true").data("lay",lay.layers[i]).text(lay.layers[i].prop.text);
			}else if(lay.layers[i].prop.img){
				item = $("<img/>").addClass("img-ele").attr("draggable","true").data("lay",lay.layers[i]).attr("src",lay.layers[i].prop.img);
			}
			if(item){
				dragItem(item);
				itemCont.append(item);
				itemCont.append(createTagElements(lay.layers[i],itemCont));
			}
		}
		layCont.append(itemCont);
	}
	return layCont;
}
dragItem = function(item){
	item.on("dragstart",function(e){
		e.originalEvent.dataTransfer.setData("drag","lay")
		dragObj = item.data("lay");
	});
	$(document).on("dragstart",".cus-ele",function(e){
		e.originalEvent.dataTransfer.setData("drag",$(this).data("lay"))
	});
}
dropItem = function(){
	$("html").on("drop",function(e){
		e.preventDefault();
		dragItemName = e.originalEvent.dataTransfer.getData("drag");
		if(dragItemName=="lay"){
			addTagElements(dragObj,e);
		}else{
			let dragEl = $(".cus-ele.cus-"+dragItemName);
			if(dragEl.length > 0){
				let data = dragEl.data("lay-obj");
				if(dragItemName == "editclass"){
					addCSSRule(sheet,"."+dragEl.text(),$(".selected-element").addClass(dragEl.text()).attr("style"),sheet.cssRules.length);
					$(".html-editor-component .class-container").append($("<div/>").addClass("cus-ele cus-class cus-"+dragEl.text()).attr("draggable","true").text(dragEl.text()).data("lay",dragEl.text()).data("lay-obj",{"class":dragEl.text()}));
				}else{
					addTagElements(data,e);
				}
			}
		}
	});
	$("html").on("dragover",function(e){
		e.preventDefault();
	});
}
addTagElements = function(lay,e){
	if(lay.section){
		var el = $("<section/>").addClass(lay.class).css({"width":"100%","height":Math.round((lay.bottom - lay.top)/2)+"px"}).css({
			"background": lay.prop.background
		});
		addTagEvents(el);
		$("body main").append(el);
	}else if(lay.text){
		var el = $("<"+lay.prop.tag+"/>").html(lay.prop.text).css({
			"font-size": lay.prop.fontSize,
			"color": lay.prop.color,
			"font-weight": lay.prop.fontWeight,
			"line-height": lay.prop.lineHeight,
			"text-align":lay.prop.textAlign,
			"text-decoration": lay.prop.textDecoration,
			"font-style": lay.prop.fontStyle
		});
		addTagEvents(el);
		$(e.target).append(el);
	}else if(lay.html){
		var el = $(lay.html);
		el.find("[data-tag]").each(function(){
			addTagEvents($(this));
		});
		$(e.target).append(el);
	}else if(lay.style){
		$(".selected-element").css(lay.style);
	}else if(lay.class){
		$(".selected-element").addClass(lay.class);
	}else if(lay.canvas){
		if(lay.prop.predictionTag == "icon" || lay.prop.predictionTag == "img"){
			var el = $("<img/>").attr("src",lay.prop.img).css({
				"width": Math.round((lay.right - lay.left)/2)+"px"
			});
			$(e.target).append(el);
		}else if(lay.prop.predictionTag == "card"){
			var el = $("<div/>").css({
				"background": lay.prop.background,
				"box-shadow": lay.prop.boxShadow,
				"border": lay.prop.border,
				"display": "inline-block",
				"width": Math.round((lay.right - lay.left)/2)+"px",
				"height": Math.round((lay.bottom - lay.top)/2)+"px"
			});
			addTagEvents(el);
			$(e.target).append(el);
		}
	}
}
addTagEvents = function(el){
	$(".selected-element").removeClass("selected-element");
	el.addClass("selected-element");
	el.on("click",function(e){
		$(".selected-element").removeClass("selected-element");
		el.addClass("selected-element");
		addTagHandlers(el);
		if(pad){
			$(".html-editor-component .pad-box").click();
		}else{
			$(".html-editor-component .mar-box").click();
		}
		shiftHandles = [];
		e.stopPropagation();
	});
	el.click();
}
addTagHandlers = function(el){
	if(el.find("> .e-handle").length == 0){
		var thand = $("<div/>").addClass("t-hand").addClass("e-handle");
		var bhand = $("<div/>").addClass("b-hand").addClass("e-handle");
		var rhand = $("<div/>").addClass("r-hand").addClass("e-handle");
		var lhand = $("<div/>").addClass("l-hand").addClass("e-handle");
		el.append(thand);
		el.append(bhand);
		el.append(rhand);
		el.append(lhand);
	}
}
getLessCode = function(el,lvl){
	let temp = "";
	var elList = el.children();
	if(elList.length > 0){
		for(let i=0;i<elList.length;i++){
			let e = elList[i];
			if(!e.classList.contains("e-handle")){
				let eClass = "";
				if(e.classList.length>0){
					for(let j=0;j<e.classList.length;j++){
						if(e.classList[j] != "selected-element"){
							eClass += "."+e.classList[j];
						}
					}
				}
				if(e.localName != "br"){
					temp += lvl + (e.localName != "div"?e.localName:"") + (e.id!=""?"#"+e.id:"") + eClass +"{\n" + (lvl+"\t") + $(e).attr("style") + "\n" + getLessCode($(e),lvl+"\t") +lvl+"}\n";
				}
			}
		}
	}
	return temp;
}
getPugCode = function(el,lvl){
	let temp = "";
	var elList = el.children();
	if(elList.length > 0){
		for(let i=0;i<elList.length;i++){
			let e = elList[i];
			if(!e.classList.contains("e-handle")){
				let eClass = "";
				if(e.classList.length>0){
					for(let j=0;j<e.classList.length;j++){
						if(e.classList[j] != "selected-element"){
							eClass += "."+e.classList[j];
						}
					}
				}
				let textNode = false;
				if(e.childNodes.length > 0){
					for(let k=0;k<e.childNodes.length;k++){
						let node = e.childNodes[k];
						if(node.nodeType == 3){
							textNode = true;
							break;
						}
					}
				}
				let nodeStr = "";
				if(textNode){
					nodeStr = getNodeCode(e);
				}
				temp += lvl + (e.localName != "div"?e.localName:"") + (e.id!=""?"#"+e.id:"") + eClass + (nodeStr!=""?(" "+nodeStr):"")+ "\n";
				if(e.children.length > 0 && !textNode){
					temp  += getPugCode($(e),lvl+"\t");
				}
			}
		}
	}
	return temp;
}
getNodeCode = function(e){
	let nodeStr = "";
	for(let k=0;k<e.childNodes.length;k++){
		let node = e.childNodes[k];
		if(node.nodeType == 3){ //text node
			nodeStr  += node.textContent;
		}else if(node.nodeType == 1){ //element node
			if(!node.classList.contains("e-handle")){
				let nodeClass = "";
				if(node.classList.length>0){
					for(let j=0;j<node.classList.length;j++){
						if(node.classList[j] != "selected-element"){
							nodeClass += "."+node.classList[j];
						}
					}
				}
				childNodeStr = getNodeCode(node);
				nodeStr += "#["+(node.localName != "div"?node.localName:"") + (node.id!=""?"#"+node.id:"") + nodeClass + (childNodeStr!=""?(" "+childNodeStr):"") +"]";
			}
		}
	}
	return nodeStr;
}
evePos = function(e){
	if (e.type === "touchstart") {
		return [e.touches[0].clientX, e.touches[0].clientY];
	} else {
		return [e.clientX, e.clientY];
	}
}
// $(window).unload(function(){

// });