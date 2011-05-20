// ==========================================================================
// Project:   Car
// Copyright: @2011 My Company, Inc.
// ==========================================================================
/*globals Car */

Car = SC.Application.create();

SC.ready(function() {
  Car.mainPane = SC.TemplatePane.append({
    layerId: 'car',
    templateName: 'car'
  });
});
