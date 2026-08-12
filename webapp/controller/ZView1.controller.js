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
            this._oResourceBundle = this._oComponent.getModel('i18n').getResourceBundle();
            this._oRouter.getRoute("RouteZView1").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched:function(){
             this._GetIcnTbBarCount();
        },
        _GetIcnTbBarCount:function(){
            BusyIndicator.show(0);
            this._oDataModel.read("/MJE_COUNTSet", {
                success: function(oData, oResponse){
                    if(oData.results.length > 0){
                        this._oMainModel.setProperty("/aCountReq", oData.results[0].OpenCount);
                        this._oMainModel.setProperty("/aCountApprovedReq", oData.results[0].AprCount);
                        this._oMainModel.setProperty("/aCountRejectReq", oData.results[0].RejCount);
                    }
                    BusyIndicator.hide();
                }.bind(this),
                error: function(oError){            
                    MessageBox.error(oError.message);
                    BusyIndicator.hide();
                }
            });
        },
        onPressDocNo:function(oEvent){
            var oBj = oEvent.getSource().getBindingContext().getObject(),
            sUrl= "#AccountingDocument-manage?"+"CompanyCode="+oBj.Bukrs+"&FiscalYear="+oBj.Gjahr+"&AccountingDocument="+oBj.Belnr;
            
            this._onOpenApp(sUrl);
        },
        _onOpenApp:function(sUrl){
            
            //var sPathName = window.location.pathname + window.location.search + sUrl;
            var sPathName = "/sap/bc/ui2/flp"+sUrl
            window.open(sPathName,"_blank");
        },
        onPressEdit:function(){
            var bProperty =  this._oMainModel.getProperty("/bEditable");
            this._oMainModel.setProperty("/bEditable",!bProperty);
        },
        onPressMultiApproval:function(oEvent){
            var oTable = this._oView.byId("idMappingTable");
               const aIndices = oTable.getSelectedIndices(); //
                const oSelectedItems = aIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject()); 
            if(this._CheckSaveValidations(oSelectedItems,"APPROVED")){  
                MessageBox.confirm(this._oResourceBundle.getText("xmsg.Message5"), {
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this._sendMultipleRequestForApproval(oSelectedItems,"APPROVED");
                        }
                    }.bind(this)
                 });
            }
            
        },
        //ReviewNotes
        _CheckSaveValidations: function(oSelectedItems,mFlagStatus){
            // 1. First validation
            if(oSelectedItems.length <= 0){
                MessageBox.error(this._oResourceBundle.getText("xmsg.Message1"));
                return false;
            }

            // 2. Second Validation For the Coments
            for (var x in oSelectedItems) {
                if(!oSelectedItems[x].ReviewNotes){
                    MessageBox.error(this._oResourceBundle.getText("xmsg.Message11",[mFlagStatus==="APPROVED"?'Approved':'Rejected']));
                    return false;
                }
            }
            return true;
                
        },
        onPressMultiReject:function(oEvent){
            var oTable = this._oView.byId("idMappingTable");
                const aIndices = oTable.getSelectedIndices(); //
                const oSelectedItems = aIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject()); 
            if(this._CheckSaveValidations(oSelectedItems,"REJECTED")){  
                MessageBox.confirm(this._oResourceBundle.getText("xmsg.Message6"), {
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this._sendMultipleRequestForApproval(oSelectedItems,"REJECTED");
                        }
                    }.bind(this)
                 });
            }
            
        },
        onPressMultiReject2:function(oEvent){
            var oTable = this._oView.byId("idMappingTable"),
                oSelectedItems = oTable.getSelectedItems();
            if(oSelectedItems.length > 0){  
                this._OpenCommentsBox().then(function(){
                    this._sendMultipleRequestForApproval(oSelectedItems,"REJECTED");
                }.bind(this)).catch(function(){
                    
                })
            }else{
                MessageBox.error(this._oResourceBundle.getText("xmsg.Message1"));
            }
        },
        _sendMultipleRequestForApproval2:function(oSelectedItems,sStatus){
            for (var x in oSelectedItems){
                var sPath = oSelectedItems[0].getBindingContext().getPath();
                this._oDataModel.setProperty(sPath+"/Approver",sStatus);
            }
            this._oDataModel.submitChanges();
        },

       _sendMultipleRequestForApproval:function(oSelectedItems, sStatus){ 
             BusyIndicator.show(0);  
            var aArray = [];
            for (var x in oSelectedItems) {
                var oSelectedObj = oSelectedItems[x],
                oPayloadObj = {
                    "Bukrs":oSelectedObj.Bukrs,
                    "Gjahr":oSelectedObj.Gjahr,
                    "Belnr": oSelectedObj.Belnr,
                    "Monat":oSelectedObj.Monat,
                    "UserTag":oSelectedObj.UserTag,
                    "RiskLevel":oSelectedObj.RiskLevel,
                    "Tcode":oSelectedObj.Tcode, 
                    "Blart":oSelectedObj.Blart,
                    "ReviewStatus": sStatus,
                    "Racct":oSelectedObj.Racct,
                    "Bldat":oSelectedObj.Bldat,
                    "Budat":oSelectedObj.Budat,
                    "Usnam":oSelectedObj.Usnam,
                    //"Approver":sStatus,
                    //"ReviewNotes":this._oMainModel.getProperty("/oDialogComments/sDescription")
                    "ReviewNotes":oSelectedItems.ReviewNotes,
                    "ReviewDate":new Date(),
                    
                }
                //console.log(oSelectedObj)
                aArray.push(oPayloadObj);
            }       
            var oPayload = {
                "Approver":sStatus === "APPROVED" ? "A" : "R",
                //"Message":"",
                "Approved_Items": aArray
            };
            console.log(oPayload)
            this._oDataModel.create("/MJE_HEADERSet", oPayload, {
                success: function(oData, oResponse){
                    //this._oDialogAddComments.close();
                    MessageBox.success(this._oResourceBundle.getText("xmsg.Message10",[oData.Approver==="A" ? 'Approved':'Rejected']));
                    this._GetIcnTbBarCount();
                    this._refreshTable()
                    BusyIndicator.hide();
                }.bind(this),
                error: function(oError){
                    //this._oDialogAddComments.close();
                    //MessageBox.error(oError.message);
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
            this._oMainModel.setProperty("/bEditable",false);
        }


    });
});
