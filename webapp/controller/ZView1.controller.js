sap.ui.define([
    "sap/ui/core/mvc/Controller",
      "sap/ui/core/Fragment",    
      "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
],
function (Controller,Fragment,MessageBox,MessageToast,BusyIndicator) {
    "use strict";

    return Controller.extend("com.cfin.zcfinmjedashapr.controller.ZView1", {
        onInit: function () {
            this._oComponent = this.getOwnerComponent();
            this._oRouter = this._oComponent.getRouter();
            this._oMainModel = this._oComponent.getModel("oMainModel");
            this._oView = this.getView();
            this._oDataModel = this._oComponent.getModel();
            this._oResrcBundle = this._oComponent.getModel('i18n').getResourceBundle();
        },
        onPressDocNo:function(oEvent){
            var oBj = oEvent.getSource().getBindingContext().getObject(),
            sUrl= "#AccountingDocument-manage?"+"CompanyCode="+oBj.Bukrs;
            console.log(sUrl)
            this._onOpenApp(sUrl);
        },
        _onOpenApp:function(sUrl){
            var sPathname = window.location.pathname + window.location.search + sUrl;
            window.open(sPathname,"_blank");
        },
        onPressMultiApproval:function(oEvent){
            var oTable = this._oView.byId("idMappingTable"),
                oSelectedItems = oTable.getSelectedItems();
            if(oSelectedItems.length > 0){  
                this._OpenCommentsBox().then(function(){
                    this._sendMultipleRequestForApproval(oSelectedItems,"APPROVED");
                }.bind(this)).catch(function(){
                    console.log("press cancel");
                })
            }else{
                MessageBox.error(this._oResourceBundle.getText("xmsg.Message1"));
            }
        },
        onPressMultiReject:function(oEvent){
            var oTable = this._oView.byId("idMappingTable"),
                oSelectedItems = oTable.getSelectedItems();
            if(oSelectedItems.length > 0){  
                this._OpenCommentsBox().then(function(){
                    this._sendMultipleRequestForApproval(oSelectedItems,"REJECTED");
                }.bind(this)).catch(function(){
                    console.log("press cancel");
                })
            }else{
                MessageBox.error(this._oResourceBundle.getText("xmsg.Message1"));
            }
        },
       _sendMultipleRequestForApproval:function(oSelectedItems, sStatus){ 
             BusyIndicator.show(0);  
            var aArray = [],oPayloadObj={};
            for (var x in oSelectedItems) {
                var oSelectedObj = oSelectedItems[x].getBindingContext().getObject();
                oPayloadObj = {
                    "Bukrs":oSelectedObj.Bukrs,
                    "Gjahr":oSelectedObj.Gjahr,
                    "Monat":oSelectedObj.Monat,
                    "ReviewStatus": sStatus,
                    "ReviewNotes":this._oMainModel.getProperty("/oDialogComments/sDescription")
                }
                aArray.push(oPayloadObj);
            }       
            var oPayload = {
                "SampleX":"X",
                "Approved_Items": aArray
            };
            this._oDataModel.create("/MJE_DETAILSSet", oPayload, {
                success: function(oData, oResponse){
                    this._oDialogAddComments.close();
                    MessageToast.show(this._oResourceBundle.getText("xmsg.Message3"));
                    this._refreshTable()
                    BusyIndicator.hide();
                }.bind(this),
                error: function(oError){
                    this._oDialogAddComments.close();
                    MessageBox.error(oError.message);
                    BusyIndicator.hide();
                }.bind(this),
            });
        },
        _OpenCommentsBox:function(){
             return new Promise(function (resolve, reject) {
                this._oResolve = resolve;
                this._oReject = reject;
                this._onPressAddComments();
            }.bind(this))
        },
        _onPressAddComments: function () {
            if (!this._oDialogAddComments) {
                Fragment.load({
                    name: "com.cfin.zcfinmjedashapr.view.fragments.dashboard.ZAddComments",
                    controller: this,
                }).then(
                    function (oDialog) {
                        this._oDialogAddComments = oDialog;
                        this._oView.addDependent(this._oDialogAddComments);
                        this._oDialogAddComments.open()
                    }.bind(this)
                );
            } else {
                this._oDialogAddComments.open();
            }
        },
        onPressAddDialogComments: function () {
            if (this._oResolve) {
                this._oResolve();
            }
        },
        onDialogAfterClose: function (oEvent, mParam) {
            if (mParam === "AddComments") {
                this._oMainModel.setProperty("/oDialogComments/sDescription", "")
                return;
            }
        },
           /*
      * method to handle the dialog close
      */
        onDialogClose: function (oEvent, mParam) {
            if (mParam === "AddComments") {
                this._oDialogAddComments.close();
                if (this._oReject) {
                    this._oReject();
                }
                return;
            }
        },
        _refreshTable:function(){
            this._oView.byId("idMappingSmartTable").rebindTable();
            this._oView.byId("idMappingTable").removeSelections(true);
        }


    });
});
