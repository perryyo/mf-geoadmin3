goog.provide('ga_edit_directive');

goog.require('ga_debounce_service');
goog.require('ga_exportglstyle_service');
goog.require('ga_filestorage_service');
goog.require('ga_glstyle_service');
goog.require('ga_layers_service');
goog.require('ga_maputils_service');
goog.require('ga_mvt_service');

(function() {

  var module = angular.module('ga_edit_directive', [
    'ga_exportglstyle_service',
    'ga_glstylestorage_service',
    'ga_debounce_service',
    'ga_glstyle_service',
    'ga_layers_service',
    'ga_maputils_service',
    'ga_mvt_service'
  ]);

  /**
   * This directive add an interface where you can modify a glStyle.
   */
  module.directive('gaEdit', function($rootScope, $window, $translate, gaMvt,
      gaDebounce, gaGlStyleStorage, gaExportGlStyle, gaGlStyle, gaLayers,
      gaMapUtils) {
    return {
      restrict: 'A',
      templateUrl: 'components/edit/partials/edit.html',
      scope: {
        map: '=gaEditMap',
        options: '=gaEditOptions',
        layer: '=gaEditLayer',
        isActive: '=gaEditActive'
      },
      link: function(scope, element, attrs, controller) {

        /// /////////////////////////////////
        // create/update the file on s3
        /// /////////////////////////////////
        var save = function(evt, layer, glStyle) {
          scope.statusMsgId = 'edit_file_saving';

          gaExportGlStyle.create(glStyle).then(function(dataString) {

            if (!dataString) {
              return;
            }

            // Get the id to use by the glStyleStorage, if no id
            // the service will create a new one.
            var id = layer.adminId;
            gaGlStyleStorage.save(id, dataString).then(function(data) {
              scope.statusMsgId = 'edit_file_saved';

              // If a file has been created we set the correct id to the
              // layer
              if (data.adminId) {
                layer.adminId = data.adminId;
                layer.externalStyleUrl = data.fileUrl;
                layer.useThirdPartyData = true;
              }
            }
            );
          });
        };
        scope.saveDebounced = gaDebounce.debounce(save, 2000, false, false);

        /// ////////////////////////////////
        // More... button functions
        /// ////////////////////////////////

        scope.canExport = function(layer) {
          return !!(layer && layer.glStyle);
        };

        scope.export = function(evt, layer) {
          if (evt.currentTarget.attributes.disabled) {
            return;
          }
          gaExportGlStyle.createAndDownload(layer.glStyle);
          evt.preventDefault();
        };

        // Apply the default style to the layer.
        scope.reset = function(evt, layer) {
          if (evt.currentTarget.attributes &&
              evt.currentTarget.attributes.disabled) {
            return;
          }
          var str = $translate.instant('edit_confirm_reset_style');
          if ($window.confirm(str)) {
            // Delete the file on server ?
            layer.externalStyleUrl = undefined;
            layer.useThirdPartyData = false;
            gaMvt.reload(layer);
          }
        };

        /// /////////////////////////////////
        // Show share modal
        /// /////////////////////////////////
        scope.canShare = function(layer) {
          return !!(layer && layer.adminId);
        };
        scope.share = function(evt, layer) {
          if (evt.currentTarget.attributes.disabled) {
            return;
          }
          $rootScope.$broadcast('gaShareDrawActive', layer);
        };

        var activate = function() {};

        var deactivate = function() {};

        scope.$watch('isActive', function(active) {
          if (active) {
            activate();
          } else {
            deactivate();
          }
        });

        scope.$on('destroy', function() {
          deactivate();
        })

        scope.$on('gaGlStyleChanged', function(evt, glStyle) {
          gaMapUtils.applyGlStyleToOlLayer(scope.layer, glStyle);
          scope.saveDebounced({}, scope.layer, glStyle);
        });
      }
    };
  });
})();