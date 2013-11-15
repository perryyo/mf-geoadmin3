(function() {
  goog.provide('ga_profile_directive');

  goog.require('ga_profile_service');

  var module = angular.module('ga_profile_directive', [
    'ga_profile_service'
  ]);

  module.directive('gaProfile',
      function(gaProfileService) {
        return {
          restrict: 'A',
          templateUrl: 'components/profile/partials/profile.html',
          scope: {
            options: '=gaProfileOptions'
          },
          replace: true,
          transclude: true,
          link: function(scope, element, attrs) {
            var options = scope.options;

            scope.updateProfile = gaProfileService;

            scope.$on('gaProfileDataLoaded', function(ev, data) {
              scope.updateProfile(data, options);
            });
          }
        };
      });
})();
