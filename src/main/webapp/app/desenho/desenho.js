'use strict';

angular.module('myApp.desenho', ['ngRoute','blockUI'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/desenho', {
    templateUrl: 'desenho/desenho.html',
    controller: 'DesenhoCtrl'
  });
}])
    .controller('DesenhoCtrl', ['$scope', '$http', '$timeout', 'ChatService', 'blockUI', function($scope, $http, $timeout, ChatService, blockUI) {
      var canvas, ctx,$img, intervalo;
      var ws, stompClient = null;
      $scope.max = 140;

      $scope.desenho = {};
      $scope.desenho.messages = [];

      $scope.trocaTurno = false;

      $scope.jogador = null;

      var blockTurno = blockUI.instances.get('blockTurno');

      $scope.toggleBlock = function() {
          blockTurno.start();
      };

      $scope.undo = function(){
        $scope.desenho.version --;
      };

      $scope.clean = function(){
        $scope.desenho.version = 0;
      };

      $scope.addMessage = function() {
        ChatService.send($scope.desenho.message);
        $scope.desenho.message = "";
      };

      function finalizar(){
        blockTurno.start({message: "A palavra era " + $scope.desenho.palavra});
        $timeout(
            $scope.stop()
        , 10000);
      }

      ChatService.receive().then(null, null, function(message) {
        $http.get("/fim").
            success(function (data) {
              $scope.trocaTurno = data;
              console.log(data);
              if($scope.trocaTurno == 'false') {
                $scope.desenho.messages.push(message);
              }
              else{
                finalizar();
              }
            });
      });

      $scope.init = function(){
        blockTurno.start({message: "Aguardando jogador .."});
        $http.get("/jogador")
            .success(function(data){
              $scope.jogador = data;
              if($scope.jogador != '') {
                blockTurno.stop();
                if (data.turn) {
                  $http.get("/palavra")
                      .success(function (data) {
                        $scope.desenho.palavra = data;
                      });
                }
                intervalo = setInterval(function () {
                  if ($scope.jogador.turn) {
                    html2canvas($("#cvs"), {
                      onrendered: function (canvas) {
                        ctx = canvas.getContext('2d');
                        $scope.url = canvas.toDataURL("image/png");

                        $http.post("/foto",
                            {
                              url: $scope.url
                            }
                        );
                      },
                      width: 300,
                      height: 300
                    });
                  }
                  else {
                    $http.get("/foto")
                        .then(function (data) {
                          if (data.length > 0)
                            $("#img").attr("src");
                          $scope.link = data.data.url;
                        });
                  }

                }, 1000);
              }
            });
      };

      $scope.stop = function(){
        $scope.clean();
        $scope.trocaTurno = true;
        blockTurno.start({message: "Aguardando proximo jogador .."});
        clearInterval(intervalo);
      }
    }]);