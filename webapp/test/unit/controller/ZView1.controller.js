/*global QUnit*/

sap.ui.define([
	"com/cfin/zcfinmjedashapr/controller/ZView1.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ZView1 Controller");

	QUnit.test("I should test the ZView1 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
