// ------------------------------------------------------------------------------
// Author: Tai H. Le <taihle@gmail.com>
// ------------------------------------------------------------------------------
var e3xApp = angular.module('e3xApp', ['ui.router', 'ngSanitize', 'ngMaterial', 'ngMessages', 'lfNgMdFileInput', 'ngFileUpload', 'ngMaterialDatePicker', 'LocalStorageModule']);

e3xApp.config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $httpProvider, localStorageServiceProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'views/main.html',
            controller: 'mainCtrl'
        })
        .state('signup', {
            url: '/',
            templateUrl: 'views/signup.html',
            controller: 'signupCtrl'
        })
        .state('chat', {
            url: '/',
            templateUrl: 'views/chat.html',
            controller: 'chatCtrl',
            params: {'room': {} }
        })
        .state('settings', {
            url: '/',
            templateUrl: 'views/settings.html',
            controller: 'settingsCtrl'
        })
        .state('profile', {
            url: '/',
            templateUrl: 'views/profile.html',
            controller: 'profileCtrl'
        });

    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');

    $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey')

    $httpProvider.defaults.withCredentials = true;

    localStorageServiceProvider.setPrefix('e3xApp');
});

e3xApp.run(function () {
    
});