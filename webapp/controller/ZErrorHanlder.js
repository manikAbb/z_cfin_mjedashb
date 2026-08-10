sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/base/util/JSTokenizer"
], function (UI5Object, MessageBox, MessageToast, JSTokenizer) {
	"use strict";

	return UI5Object.extend("com.cfin.zcfinmjedashapr.controller.ZErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias com.evorait.evoplan.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showServiceError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				this._showServiceError(oParams.response);
			}, this);
			
		},

		/**
		 * Extract messages from a the MessageModel.
		 * @Author Rahul
		 * @param {object} oData data of MessageModel
		 * @return
		 * @function
		 * @public
		 */
		createMessages: function () {
			var aMessages = JSON.parse(JSON.stringify(this._oComponent.getModel("MessageModel").getData()));
			var iCountError = 0,
				iCountWarning = 0,
				iCountSuccess = 0,
				iCounter = 0,
				iCountInfo = 0;
			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
			var oData = oMessageModel.getData();
			var oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();

			if (oData.length === 0) {
				return;
			}

			for (var i = 0; i < oData.length; i++) {
				var item = {};
				if (oData[i].type === "Error") {
					item.title = oResourceBundle.getText("xtit.errorMsg");
					iCountError = iCountError + 1;
					iCounter = iCountError;
				}
				if (oData[i].type === "Warning") {
					item.title = oResourceBundle.getText("xtit.warningMsg");
					iCountWarning = iCountWarning + 1;
					iCounter = iCountWarning;
				}
				if (oData[i].type === "Success") {
					item.title = oResourceBundle.getText("xtit.successMsg");
					iCountSuccess = iCountSuccess + 1;
					iCounter = iCountSuccess;
				}
				if (oData[i].type === "Information") {
					item.title = oResourceBundle.getText("xtit.informationMsg");
					iCountInfo = iCountInfo + 1;
					iCounter = iCountInfo;
				}
				item.type = oData[i].type;
				item.description = oData[i].message;
				item.subtitle = oData[i].message;
				//item.counter = iCounter; used for displaying the count for the types of messages in message manager

				if (!JSON.stringify(aMessages).includes(JSON.stringify(item))) {
					aMessages.unshift(item);
				}

			}
			this._oComponent.getModel("MessageModel").setData(aMessages);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				this._extractError(sDetails), {
					id: "serviceErrorMessageBox",
					//details: this._extractError(sDetails),
					//styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		/**
		 * Extract errors from a backend message class.
		 * @param {object} sDetails a technical error
		 * @return a either messages from the backend message class or return the initial error object
		 * @function
		 * @private
		 */

		_extractError: function (sDetails) {
			console.log(sDetails)
			if (sDetails.headers["Content-Type"].includes("xml")){
				return this._extractErrorXml(sDetails)
			}else {
				return this._extractErrorJson(sDetails)
			}
			
		},
		_extractErrorXml:function(oResponse){
			var sResponseBody = oResponse.responseText || oResponse.body;
			var sErrorMessage = "An unknown error occurred.";

			// Check if the response body is likely XML
			
			try {
				// Parse the XML response
				var oXMLResponse = jQuery.parseXML(sResponseBody);
				// Find the message tag and get its text content
				var oXMLMessage = oXMLResponse.querySelector("message");
				if (oXMLMessage) {
					sErrorMessage = oXMLMessage.textContent;
				}
				return sErrorMessage;
			} catch (e) {
				// Log parsing error if the XML is malformed
				return sErrorMessage;
			}
			

		},
		_extractErrorJson:function(sDetails){
			if (sDetails.responseText) {
				var parsedJSError = null;
				try {
					parsedJSError = JSTokenizer.parseJS(sDetails.responseText);
					
				} catch (err) {
					return sDetails;
				}

				if (parsedJSError && parsedJSError.error && parsedJSError.error.code) {
					var strError = "";
					//check if the error is from our backend error class
					
						var array = parsedJSError.error.innererror.errordetails;
						for (var i = 0; i < array.length; i++) {
							strError += String.fromCharCode("8226") + " " + array[i].message + "\n";
						}
						if(array.length===0){
							strError+=String.fromCharCode("8226") + " " + parsedJSError.error.message.value + "\n"
						}
					return strError;
				}
			}
			return sDetails;
		},
		xml2json:function (srcDOM) {
			let children = [...srcDOM.children];
			
			// base case for recursion. 
			if (!children.length) {
				return srcDOM.innerHTML
			}
			
			// initializing object to be returned. 
			let jsonResult = {};
			
			for (let child of children) {
				
				// checking is child has siblings of same name. 
				let childIsArray = children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;

				// if child is array, save the values as array, else as strings. 
				if (childIsArray) {
				if (jsonResult[child.nodeName] === undefined) {
					jsonResult[child.nodeName] = [this.xml2json(child)];
				} else {
					jsonResult[child.nodeName].push(this.xml2json(child));
				}
				} else {
				jsonResult[child.nodeName] = this.xml2json(child);
				}
			}
			
			return jsonResult;
			}
	});
});