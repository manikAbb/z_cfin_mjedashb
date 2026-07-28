sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("com.cfin.zcfinmjedashapr.controller.ZView1", {
        onInit: function () {

        },
        onPressDocNo:function(oEvent){
            var oBj = oEvent.getSource().getBindingContext().getObject();
            console.log(oBj);
        }
    });
});
