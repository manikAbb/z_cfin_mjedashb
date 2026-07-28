sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.cfin.zcfinmjedashapr.controller.ZView1", {
        onInit: function () {

        },
        onPressDocNo:function(oEvent){
            var oBj = oEvent.getSource().getBindingContext().getObject(),
            sUrl= "#AccountingDocument-manage?"+"CompanyCode="+oBj.Bukrs;
            console.log(sUrl)
            //this._onOpenApp(sUrl);
        },
        _onOpenApp:function(sUrl){
            var sPathname = window.location.pathname + window.location.search + sUrl;
            window.open(sPathname,"_blank");
        }
        
    });
});
