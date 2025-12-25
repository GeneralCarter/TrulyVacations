if (!window.OwnerRez || !window.OwnerRez.loadWidgets) {
  let hasRegisteredGAChannel = false;
  let loadCount = 0;
  (function () {
    // http://www.onlineaspect.com/2010/01/15/backwards-compatible-postmessage/
    // everything is wrapped in the XD function to reduce namespace collisions
    var XD = function () {
      var interval_id,
        last_hash,
        cache_bust = 1,
        attached_callback,
        window = this;

      return {
        postMessage: function (message, target_url, target) {
          if (!target_url) {
            return;
          }
          target = target || parent;  // default to parent
          if (window['postMessage']) {
            // the browser supports window.postMessage, so call it with a targetOrigin
            // set appropriately, based on the target_url parameter.
            target['postMessage'](message, target_url.replace(/([^:]+:\/\/[^\/]+).*/, '$1'));
          } else if (target_url) {
            // the browser does not support window.postMessage, so use the window.location.hash fragment hack
            target.location = target_url.replace(/#.*$/, '') + '#' + (+new Date) + (cache_bust++) + '&' + message;
          }
        },
        receiveMessage: function (callback, source_origin) {
          // browser supports window.postMessage
          if (window['postMessage']) {
            // bind the callback to the actual event associated with window.postMessage
            if (callback) {
              attached_callback = function (e) {
                if ((typeof source_origin === 'string' && e.origin !== source_origin)
                  || (Object.prototype.toString.call(source_origin) === "[object Function]" && source_origin(e.origin) === !1)) {
                  return !1;
                }
                callback(e);
              };
            }
            if (window['addEventListener']) {
              window[callback ? 'addEventListener' : 'removeEventListener']('message', attached_callback, !1);
            } else {
              window[callback ? 'attachEvent' : 'detachEvent']('onmessage', attached_callback);
            }
          } else {
            // a polling loop is started & callback is called whenever the location.hash changes
            interval_id && clearInterval(interval_id);
            interval_id = null;
            if (callback) {
              interval_id = setInterval(function () {
                var hash = document.location.hash,
                  re = /^#?\d+&/;
                if (hash !== last_hash && re.test(hash)) {
                  last_hash = hash;
                  callback({ data: hash.replace(re, '') });
                }
              }, 100);
            }
          }
        }
      };
    }();

    // http://www.javascriptkit.com/dhtmltutors/dhtmlcascade4.shtml
    var getStyle = function (el, cssprop) {
      if (el.currentStyle) //IE
        return el.currentStyle[cssprop]
      else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
        return document.defaultView.getComputedStyle(el, "")[cssprop]
      else //try and get inline style
        return el.style[cssprop]
    }

    var loadWidget = function (el, id, propertyId, tracker, gclid, ga_client_id, ga_session_id) {
      console.debug("Loading widget with id:", id, propertyId);
      if (!id) {
        if (window.console && window.console.debug)
          (console.error || console.debug)("Null OwnerRez widget id on loadWidget.");

        return;
      }

      var seq = window.OwnerRez.widgetSeq++;

      //el.style.display = "none";

      var frame = document.createElement("iframe");

      var url = "https://app.ownerrez.com/widgets/" + id + "?seq=" + seq;

      if (propertyId)
        url += "&propertyKey=" + propertyId;

      if (gclid)
        url += "&gclid=" + gclid;

      if (ga_client_id)
        url += "&ga_client_id=" + ga_client_id;

      if (ga_session_id)
        url += "&ga_session_id=" + ga_session_id;

      // Parse the Query String
      // https://stackoverflow.com/a/3855394/8037
      var qs = (function (a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
          var p = a[i].split('=', 2);
          var fieldName = p[0];
          if (p.length == 1)
            b[fieldName] = "";
          else {
            var value = decodeURIComponent(p[1].replace(/\+/g, " "));
            if (b.hasOwnProperty(fieldName)) {
              // The same query string element is repeated - treat it as an array
              var existingValue = b[fieldName];
              if (!Array.isArray(existingValue))
                b[fieldName] = [existingValue]

              b[fieldName].push(value);
            } else {
              b[fieldName] = value;
            }
          }
        }
        return b;
      })(window.location.search.substr(1).split('&'));

      const skipParams = ["seq", "view"].map(z => z.toLowerCase());
      let newParamsToUrl = {};
      for (let key in qs) {
        let checkUrlKey = key.toLowerCase();
        let currentUrlParamValue = qs[key];
        if (skipParams.indexOf(checkUrlKey) === -1) {
          newParamsToUrl[checkUrlKey] = currentUrlParamValue;
        }
      }

      const persistParams = ["or_listingsite", "or_channel"].map(z => z.toLowerCase())
      for (let persistParam of persistParams) {
        if (newParamsToUrl.hasOwnProperty(persistParam)) {
          const paramFromUrl = newParamsToUrl[persistParam];
          if (paramFromUrl !== "" && paramFromUrl !== null && paramFromUrl !== undefined) {
            sessionStorage.setItem(persistParam, paramFromUrl);
          }
          continue;
        }
        let savedSessionParam = sessionStorage.getItem(persistParam);
        if (savedSessionParam !== "" && savedSessionParam !== null && savedSessionParam !== undefined) {
          newParamsToUrl[persistParam] = savedSessionParam;
        }
      }
      for (let [newUrlParamKey, newUrlParamValue] of Object.entries(newParamsToUrl)) {
        var valuesToAdd = Array.isArray(newUrlParamValue) ? newUrlParamValue : [newUrlParamValue];
        valuesToAdd.forEach(v => url += `&${newUrlParamKey}=${v}`);
      }

      url = `${url}`;

      if (tracker) {
        var linker = new window.gaplugins.Linker(tracker);

        url = linker.decorate(url);
      }

      if (window.OwnerRez.linkDecorator && typeof window.OwnerRez.linkDecorator === 'function')
        url = window.OwnerRez.linkDecorator(url);

      frame.src = url;
      frame.border = frame.frameBorder = 0;
      // TODO: figure out why setting to display:none and unsetting on message makes body height too big
      frame.style.cssText = "width:100%;border:0;overflow:hidden;";//display:none";
      frame.setAttribute("scrolling", "no");
      frame.setAttribute("seamless", "seamless");
      frame.setAttribute("allowTransparency", true);
      frame.className = "ownerrez-widget-iframe";
      frame.title = (el.getAttribute("data-widget-type") || "OwnerRez") + " Widget";

      // TODO: better height/width handling
      if (el.style.height) {
        frame.style.height = el.style.height;
        el.style.height = "auto";
      }

      var isDesignMode = document.body.className.indexOf("toplevel_page_revslider") != -1;

      const shouldHandleGa = !hasRegisteredGAChannel;
      if (shouldHandleGa)
        hasRegisteredGAChannel = true;

      XD.receiveMessage(function (message) {
        var data = (typeof message.data !== 'object') ? JSON.parse(message.data) : message.data;

        if (data.or_gatrackerid) {
          if (!shouldHandleGa)
            return; // Make sure only one event handler responds to this message

          const callingIFrame = Array.from(document.querySelectorAll("iframe")).find(i => i.contentWindow == message.source);
          if (callingIFrame) {
            callingIFrame.parentNode.setAttribute("data-loadid", data.loadId);
          }
          window.OwnerRez.sendGTagCrossDomain(data.or_gatrackerid, data.widgetKey, data.loadId);
        } else if (data.id != null && data.id.replace(/-/g, "") == id.replace(/-/g, "") && (!data.seq || data.seq == seq)) {
          var resizeDisabled = window.location.search && window.location.search.indexOf("noresize=true") != -1;

          if (!isNaN(data.height) && !resizeDisabled && !isDesignMode) {
            //window.console.debug("Received height: " + data.height + " @ " + new Date().getTime());

            frame.style.height = data.height + "px";

            var parent = frame.parentNode;
            var zoom = 1;

            do {
              // If a containing element has a overflow:hidden with height
              if (parent.style.overflow == "hidden" && parent.style.height && parent.style.height != "auto" && parent.style.height != "100%" && (parent.offsetHeight < data.height || parent._isOwnerRezResizing)) {
                parent.style.height = data.height + "px";

                parent._isOwnerRezResizing = true;
              }

              if (getStyle(parent, "zoom") && getStyle(parent, "zoom") != 1)
                zoom = getStyle(parent, "zoom");

              parent = parent.parentNode;
            }
            while (parent != null && parent.style && parent != document.body); // bail out if no style or body so we don't get whacked by html element that has zoom for browser zoom vs. css zoom

            // Calculate zoom properly
            if (zoom != 1 && zoom != "normal")
              frame.style.height = (data.height * (1 / zoom)) + "px";

            if (window.jQuery)
              window.jQuery(el).triggerHandler("resize.ownerrez")

            if (data.action == "scrollTop") {
              var bodyCoords = document.body.getBoundingClientRect();
              var frameCoords = frame.getBoundingClientRect();

              window.scrollTo(0, frameCoords.top - bodyCoords.top - 150);
            }
          } else if (data.url) {
            try {
              window.top.location = data.url;
            } catch (ex) {
              window.location = data.url;
            }
          }

          //frame.style.display = "block";
        }
      }, 'https://app.ownerrez.com');

      el.appendChild(frame);
    };

    /*
        Developed by Robert Nyman, http://www.robertnyman.com
        Code/licensing: http://code.google.com/p/getelementsbyclassname/
    */
    var getElementsByClassName = function (className, tag, elm) {
      if (document.getElementsByClassName) {
        getElementsByClassName = function (className, tag, elm) {
          elm = elm || document;
          var elements = elm.getElementsByClassName(className),
            nodeName = (tag) ? new RegExp("\\b" + tag + "\\b", "i") : null,
            returnElements = [],
            current;
          for (var i = 0, il = elements.length; i < il; i += 1) {
            current = elements[i];
            if (!nodeName || nodeName.test(current.nodeName)) {
              returnElements.push(current);
            }
          }
          return returnElements;
        };
      } else if (document.evaluate) {
        getElementsByClassName = function (className, tag, elm) {
          tag = tag || "*";
          elm = elm || document;
          var classes = className.split(" "),
            classesToCheck = "",
            xhtmlNamespace = "http://www.w3.org/1999/xhtml",
            namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace) ? xhtmlNamespace : null,
            returnElements = [],
            elements,
            node;
          for (var j = 0, jl = classes.length; j < jl; j += 1) {
            classesToCheck += "[contains(concat(' ', @@class, ' '), ' " + classes[j] + " ')]";
          }
          try {
            elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
          } catch (e) {
            elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
          }
          while ((node = elements.iterateNext())) {
            returnElements.push(node);
          }
          return returnElements;
        };
      } else {
        getElementsByClassName = function (className, tag, elm) {
          tag = tag || "*";
          elm = elm || document;
          var classes = className.split(" "),
            classesToCheck = [],
            elements = (tag === "*" && elm.all) ? elm.all : elm.getElementsByTagName(tag),
            current,
            returnElements = [],
            match;
          for (var k = 0, kl = classes.length; k < kl; k += 1) {
            classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
          }
          for (var l = 0, ll = elements.length; l < ll; l += 1) {
            current = elements[l];
            match = false;
            for (var m = 0, ml = classesToCheck.length; m < ml; m += 1) {
              match = classesToCheck[m].test(current.className);
              if (!match) {
                break;
              }
            }
            if (match) {
              returnElements.push(current);
            }
          }
          return returnElements;
        };
      }
      return getElementsByClassName(className, tag, elm);
    };

    var loadWidgets = function (className, tracker) {
      var widgets = getElementsByClassName(className);

      for (var i = 0; i < widgets.length; i++) {
        var el = widgets[i];

        if (!el.isWidgetLoaded) {
          var iframe = el.querySelector("iframe");

          // if there's already an iframe (bad Elementor), nuke it
          if (iframe)
            iframe.remove();

          const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
          });

          let or_propertyKey = params.or_propertyKey;
          let gclid = params.gclid;
          let ga_client_id = params.ga_client_id;
          let ga_session_id = params.ga_session_id;

          loadWidget(el, el.getAttribute("data-widgetId"), el.getAttribute("data-propertyId") ?? or_propertyKey, tracker, el.getAttribute("data-gclid") ?? gclid, el.getAttribute("data-gaClientId") ?? ga_client_id, el.getAttribute("data-gaSessionId") ?? ga_session_id);

          el.isWidgetLoaded = true;
        }
      }
    };

    var loadDefaultWidgets = function (tracker) {
      window.OwnerRez.loadWidgets("ownerrez-widget", tracker);
      // Deprecated
      window.OwnerRez.loadWidgets("ownerrez-calendar", tracker);
      window.OwnerRez.loadWidgets("ownerrez-inquiry", tracker);
    };

    // Handle Google Analytics configuration
    var gaTrackers = {};

    var sendGTagCrossDomain = function (gaTrackerId, widgetKey, loadId) {
      console.debug(`Received request for tracker data from tracker: ${gaTrackerId}, widgetKey: ${widgetKey}, loadId: ${loadId}`);
      var gaTracker = gaTrackers[gaTrackerId];
      if (gaTracker == null)
        gaTracker = gaTrackers[gaTrackerId] = { gaTrackerId: gaTrackerId };

      var widgets = document.querySelectorAll(".ownerrez-widget iframe");

      if (!window.gtag && !window.google_tag_manager) {
        if (!!gaTracker.rescheduled) {
          console.debug("Still no GA after reschedule. Allowing widget to load GA naturally.");
          return;
        }

        console.debug("No GA, cannot send data. Scheduling another attempt");
        gaTracker.rescheduled = true;
        widgets.forEach(el => {
          const iFrameParent = el.closest("div");
          const widgetid = iFrameParent.dataset.widgetid;
          const iFrameLoadId = iFrameParent.dataset.loadid;
          const shouldSend =
            widgetKey == null
            || loadId == null
            || (iFrameLoadId == loadId && widgetid == widgetKey);

          if (shouldSend) {
            var data = JSON.stringify({ gaReschedule: true });
            el.contentWindow.postMessage(data, '*')
          }
        });

        return;
      }

      function sendData(widgetKey) {
        // Each page can have multiple trackers, multiple widgets, and each can be configured for a different analytics account.
        // Make sure that each widget has access to the correct data.

        var data = JSON.stringify(gaTracker);
        var widgets = document.querySelectorAll(".ownerrez-widget iframe");
        gaTracker.hasLoaded = true;

        widgets.forEach(function (el) {
          const iFrameParent = el.closest("div");
          const widgetId = iFrameParent.dataset.widgetid;
          const iFrameLoadId = iFrameParent.dataset.loadid;
          const shouldSend =
            widgetKey == null
            || loadId == null
            || (iFrameLoadId == loadId && widgetId == widgetKey);
          if (!shouldSend)
            return;

          console.debug(`Pushing to data to widget`, widgetId, loadId, data);
          el.contentWindow.postMessage(data, "*");
        });
      }

      if (!!gaTracker.hasLoaded) {
        console.debug("gaTracker has already loaded. Re-sending data");
        sendData(widgetKey);
        return;
      }

      function resolveGTagValue(parameterName, objectName) {
        return new Promise((resolve) => {
          if (gtag != null) {
            if (gaTracker[objectName] != null)
              resolve();

            gtag('get', gaTrackerId, parameterName, function (parameter) {
              console.debug("Parameter received", parameterName, objectName, loadId);
              if (parameter != null)
                gaTracker[objectName] = parameter;

              resolve();
            });
          } else if (window.google_tag_manager != null) {
            // Tag Manager has limited data - fetch what we can.
            try {
              if (parameterName === "client_id") {
                window.cookieStore.get("_ga").then(cookie => {
                  let value = cookie.value;
                  let clientId = value?.replace("GA1.1.", "");
                  gaTracker[objectName] = clientId;
                  console.debug(`Retrieved clientId from cookie: ${clientId}`);
                  resolve();
                });
              } else if (parameterName === "session_id") {
                let sessionCookieName = `_ga_${gaTrackerId.split("-")[1]}`
                window.cookieStore.get(sessionCookieName).then(cookie => {
                  let value = cookie.value;
                  let sessionId = value?.replace("GS2.1.s", "")?.split("$")[0];
                  gaTracker[objectName] = sessionId;
                  console.debug(`Retrieved sessionId from cookie: ${sessionId}`);
                  resolve();
                });
              } else {
                resolve();
              }
            } catch (err) {
              console.error("Unable to read google cookie", err);
              resolve();
            }
          }
        });
      }

      console.debug(`Resolving google parameters for tracker: ${gaTrackerId}`, loadId);

      // Chrome was struggling to manage these callbacks without the jitter
      let jitter = (++loadCount) * 100;
      setTimeout(() => {
        Promise.all([
          resolveGTagValue('client_id', 'gaClientId'),
          resolveGTagValue('session_id', 'gaSessionId'),
          resolveGTagValue('page_referrer', 'gaPageReferrer')
        ]).then(() => {
          gaTracker.hasLoaded = true;
          console.debug(`Loaded tracker ${gaTrackerId}. Sending data`, loadId);
          sendData(widgetKey);
        });
      }, jitter);
    }

    // Load all methods onto the global OwnerRez object.
    window.OwnerRez = window.OwnerRez || [];
    window.OwnerRez.loadWidget = loadWidget;
    window.OwnerRez.loadWidgets = loadWidgets;
    window.OwnerRez.loadDefaultWidgets = loadDefaultWidgets;
    window.OwnerRez.sendGTagCrossDomain = sendGTagCrossDomain;
    window.OwnerRez.widgetSeq = 0;

  })();
}

if (window.OwnerRez.skipLoadDefaultWidgets != true)
  window.OwnerRez.loadDefaultWidgets();
