(function(window, document) {
	var tieTemplate = function (templateSelector, keepWrapAtOrigin) {

		var bindings = [];
		var baseElement;
		var targetWrapper = undefined;
		var htmlOriginalTemplate = "";
		var markerPrefix = "✂";
		var markerPostfix = "⚑";
		var latestMarkerNumber = 1000;
		var isPrepared = false;
		var templateParts = [];

		var isDomElement = function (element) {
			if (typeof HTMLElement === "object") {
				return element instanceof HTMLElement;
			}

			return element &&
				typeof element === "object" &&
				element !== null &&
				element.nodeType === 1 &&
				typeof element.nodeName === "string";
		};

		var init = function () {
			if (!templateSelector) {
				throw 'no selector or element given';
			}

			if (typeof templateSelector === 'string' || (templateSelector instanceof String)) {
				//selector
				baseElement = document.querySelector(templateSelector);
				if (baseElement === null) {
					throw 'template not found at: ' + templateSelector;
				}
			} else {
				if (isDomElement(templateSelector)) {
					//dom element
					baseElement = templateSelector
				} else {
					throw "only string or HTMLElement parameter is allowed as parameter";
				}
			}

			//remove baseElement from DOM
			if (keepWrapAtOrigin) {
				targetWrapper = baseElement;
				baseElement = targetWrapper.cloneNode(true);
				baseElement.outerHTML = targetWrapper.outerHTML;
				targetWrapper.innerHTML = '';
			} else {
				if (baseElement.parentNode) {
					baseElement.parentNode.removeChild(baseElement);
				}
			}

			htmlOriginalTemplate = baseElement.outerHTML;
		};

		var getNextFreeMarker = function () {
			var currentMarker;
			do {
				currentMarker = markerPrefix + latestMarkerNumber + markerPostfix;
				latestMarkerNumber++;
			} while (htmlOriginalTemplate.indexOf(currentMarker) > -1);
			return currentMarker;
		};

		var markBinding = function (binding) {
			var locations = [baseElement]; //fallback for '' selector
			if (binding.selector !== '') {
				locations = baseElement.querySelectorAll(binding.selector);
			}
			for (var i = 0; i < locations.length; i++) {
				var location = locations[i];
				if (binding.attr) {
					var attrValue = binding.marker;
					if (binding.attrAppendMode) {
						attrValue = location.getAttribute(binding.attr)
							+ binding.attrAppendMode
							+ binding.marker;
					}
					location.setAttribute(binding.attr, attrValue);
				} else {
					location.innerHTML = binding.marker
				}
			}
			htmlOriginalTemplate = baseElement.outerHTML;
		};

		var splitUpSnippet = function (parts) {
			for (var b = 0; b < bindings.length; b++) {
				var binding = bindings[b];
				var marker = binding.marker;

				for (var p = 0; p < parts.length; p++) {
					var part = parts[p];
					if (typeof part !== 'string' && !(part instanceof String)) continue; //skip
					if (part.indexOf(marker) === -1) continue; //skip

					var newParts = part.split(marker);
					for (var n = 1; n < newParts.length; n += 2) {
						newParts.splice(n, 0, binding);
					}

					parts.splice(p, 1); //remove old

					var leftList = parts.slice(0, p - 1);
					var rightList = parts.slice(p + 1, parts.length - 1);
					parts = leftList.concat(newParts).concat(rightList);
				}
			}
			return parts;
		};

		var splitUpTemplate = function () {
			templateParts = [htmlOriginalTemplate];
			templateParts = splitUpSnippet(templateParts);
		};

		var getBoundValue = function (data, bind, defaultValue) {
			if (bind === undefined || bind === '') {
				return data;
			}
			if (typeof bind === "function") {
				//bind callback function
				return bind(data);
			} else {
				//bind data property
				if (data && data.hasOwnProperty(bind)) {
					return data[bind];
				}
			}
			return defaultValue;
		};

		var renderTemplate = function (data) {
			var resultHtml = "";
			for (var i = 0; i < templateParts.length; i++) {
				var part = templateParts[i];
				if (typeof part === 'string' || (part instanceof String)) {
					//piece of html
					resultHtml += part;
				} else {
					var binding = part;
					var value = getBoundValue(data, binding.bind, binding.defaultValue);
					resultHtml += binding.render(value);
				}
			}
			return resultHtml;
		};

		this.prepareTemplate = function () {
			if (isPrepared) return;
			isPrepared = true;

			splitUpTemplate();
		};

		this.bindHtml = function (selector, bind) {
			var binding = {
				selector: selector,
				bind: bind,
				defaultValue: undefined,
				marker: getNextFreeMarker(),
				render: function (data) {
					return String(data);
				}
			};
			bindings.push(binding);
			markBinding(binding);
		};

		this.bindText = function (selector, bind) {
			var binding = {
				selector: selector,
				bind: bind,
				defaultValue: undefined,
				marker: getNextFreeMarker(),
				render: function (data) {
					var textNode = document.createTextNode(String(data));
					var div = document.createElement('div');
					div.appendChild(textNode);
					return div.innerHTML;
				}
			};
			bindings.push(binding);
			markBinding(binding);
		};

		function quoteAttribute(value) {
			return String(value)
				.replace(/&/g, '&amp;')
				.replace(/'/g, '&apos;')
				.replace(/"/g, '&quot;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}

		this.bindAttr = function (selector, attrName, bind) {
			var binding = {
				selector: selector,
				attr: attrName,
				bind: bind,
				defaultValue: undefined,
				marker: getNextFreeMarker(),
				render: function (data) {
					return quoteAttribute(data);
				}
			};
			bindings.push(binding);
			markBinding(binding);
		};

		this.bindClass = function (selector, bind) {
			var binding = {
				selector: selector,
				attr: 'class',
				attrAppendMode: ' ',
				bind: bind,
				defaultValue: undefined,
				marker: getNextFreeMarker(),
				render: function (data) {
					if (Array.isArray(data)) {
						return quoteAttribute(data.join(' '));
					}
					return quoteAttribute(data);
				}
			};
			bindings.push(binding);
			markBinding(binding);
		};

		this.loop = function (selector, bind) {
			var loopTElement = baseElement.querySelector(selector);
			if (loopTElement === null) {
				throw 'no sub template element found at: ' + selector;
			}
			var marker = getNextFreeMarker();
			var cloneLoopElement = loopTElement.cloneNode(true);
			loopTElement.outerHTML = marker;
			htmlOriginalTemplate = baseElement.outerHTML;

			var nestedTemplate = new tieTemplate(cloneLoopElement);
			bindings.push({
				selector: selector,
				bind: bind,
				defaultValue: [],
				marker: marker,
				render: function (arr) {
					var html = '';
					for (var j = 0; j < arr.length; j++) {
						html += nestedTemplate.render(arr[j]);
					}
					return html;
				}
			});
			return nestedTemplate;
		};

		this.if = function (selector, bind) {
			return this.loop(selector, function (data) {
				var flag = getBoundValue(data, bind, false);

				//return empty loop or loop with one entry (the data)
				return flag ? [data] : [];
			});
		};

		this.render = function (data) {
			this.prepareTemplate();
			var html = renderTemplate(data);
			if (targetWrapper !== undefined) {
				targetWrapper.outerHTML = html;
			}
			return html;
		};

		init();

		return this;
	};

	console.log(window);

	window.tie = {
		createTemplateFrom : function(templateSelector){
			return new tieTemplate(templateSelector);
		},

		createTemplateAt : function(templateSelector){
			return new tieTemplate(templateSelector, true);
		}

	};

})(window, document);