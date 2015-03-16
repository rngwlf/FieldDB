/* globals FieldDB, runs, waitsFor */
"use strict";
var debugMode = false;
var specIsRunningTooLong = 5000;


describe("Directive: fielddb-authentication", function() {

  // load the directive's module and the template
  beforeEach(module("fielddbAngularApp", "views/authentication.html", "views/locales.html"));
  var el,
    scope,
    rootScope,
    compileFunction;

  beforeEach(inject(function($rootScope, $compile) {
    el = angular.element("<div data-fielddb-authentication json='authentication'></div>");
    rootScope = $rootScope;
    scope = $rootScope.$new();
    if (debugMode) {
      console.log("scope.application", scope.application);
    }
    scope.application = {
      authentication: new FieldDB.Authentication({
        user: new FieldDB.User({
          authenticated: false
        })
      })
    };
    compileFunction = $compile(el);
    // bring html from templateCache
    scope.$digest();
    if (debugMode) {
      console.log("post compile", el.html()); // <== html here has {{}}
    }
  }));

  // http://stackoverflow.com/questions/17223850/how-to-test-directives-that-use-templateurl-and-controllers
  it("should show login form if no one is logged in", function() {

    inject(function() {
      compileFunction(scope); // <== the html {{}} are bound
      scope.$digest(); // <== digest to get the render to show the bound values
      if (debugMode) {
        console.log("post link", el.html());
        console.log("scope authentication ", scope.application.authentication);
      }
      expect(angular.element(el.find("button")[0]).text().trim()).toEqual("Login");
    });
  });

  it("should show logout button if someone is logged in", function() {

    inject(function() {
      scope.application.authentication.user.authenticated = true;
      compileFunction(scope); // <== the html {{}} are bound
      scope.$digest(); // <== digest to get the render to show the bound values
      if (debugMode) {
        console.log("post link", el.html());
        console.log("scope authentication ", scope.application.authentication);
      }
      expect(angular.element(el.find("div")[0]).attr("class")).toContain("ng-hide");
      expect(angular.element(el.find("button")[1]).text().trim()).toEqual("Logout");

    });
  });

  xit("should be able to use encryption for client side user storage in karma in phantom js", function() {
    var promiseResult,
      promisHasCompleted,
      previousClientSideLogin;

    runs(function() {

      previousClientSideLogin = new FieldDB.Authentication({
        // debugMode: true
      });
      expect(previousClientSideLogin).toBeDefined();
      console.log("trying to set the user");
      previousClientSideLogin.user = {
        _id: "jenkins",
        username: "jenkins",
        debugMode: true
      };
      expect(previousClientSideLogin.user.fieldDBtype).toEqual("User");
      expect(previousClientSideLogin.userMask).toBeUndefined();

      previousClientSideLogin.user = {
        username: "jenkins",
        anotherfield: "hi",
        researchInterest: "Test automation"
      };

      setTimeout(function() {

        if (previousClientSideLogin.user.savingPromise) {
          previousClientSideLogin.user.savingPromise.then(function(promisedUser) {
            promiseResult = promisedUser;
            promisHasCompleted = true;
          });
        } else if (previousClientSideLogin.user.fetchingPromise) {
          previousClientSideLogin.user.fetchingPromise.then(function(promisedUser) {
            promiseResult = promisedUser;
            promisHasCompleted = true;
          });
        } else if (previousClientSideLogin.resumingSessionPromise) {
          previousClientSideLogin.resumingSessionPromise.then(function(promisedUser) {
            promiseResult = promisedUser;
            promisHasCompleted = true;
          });
        } else {
          setTimeout(function() {
            promiseResult = {
              error: "no promises were run"
            };
            promisHasCompleted = true;
          }, 100);
        }

      }, 100);
    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      // expect(promiseResult.userFriendlyErrors).toEqual(["Unable to contact the server, are you sure you're not offline?"]);

      expect(previousClientSideLogin).toBeDefined();
      expect(previousClientSideLogin.user).toBeDefined();
      expect(previousClientSideLogin.user.researchInterest).toContain("Test automation");

      /* should be saved */
      var clientSideUserKey = localStorage.getItem("X09qKvcQn8DnANzGdrZFqCRUutIi2C");
      expect(clientSideUserKey).toBeDefined();

      clientSideUserKey = clientSideUserKey + "jenkins";
      var clientSideUser = localStorage.getItem(clientSideUserKey);
      expect(clientSideUser).toBeDefined();
      expect(clientSideUser).toContain("confidential");

    });
  }, specIsRunningTooLong);

  it("should run async tests", function() {
    var promiseResult,
      promisHasCompleted;

    runs(function() {
      setTimeout(function() {
        promiseResult = "ran async";
        promisHasCompleted = true;
      }, 500);
    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      expect(promiseResult).toEqual("ran async");
    });
  }, specIsRunningTooLong);


  it("should register users", function() {
    var promiseResult,
      promisHasCompleted;

    runs(function() {
      compileFunction(scope); // <== the html {{}} are bound
      scope.application.authentication.debugMode = true;

      expect(rootScope.register).toBeDefined();
      rootScope.register({
        username: "testangularcoreregister",
        password: "test",
        confirmPassword: "tes"
      }).then(function(resultScope) {
        promiseResult = resultScope;
        promisHasCompleted = true;
      }, function(resultScope) {
        promiseResult = resultScope;
        promisHasCompleted = true;
      });
      setTimeout(function() {
        promiseResult = {
          error: "no register promise ran."
        };
        promisHasCompleted = true;
      }, 2000);
    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      expect(promiseResult).toBeDefined();
      expect(promiseResult.application).toBeDefined();
      expect(promiseResult.application.authentication).toEqual(scope.application.authentication);
      expect(promiseResult.application.authentication.error).toEqual("Passwords don't match, please double check your password.");
    });

  }, specIsRunningTooLong);

  it("should login users", function() {
    var promiseResult, promisHasCompleted;

    runs(function() {
      //https://egghead.io/lessons/angularjs-unit-testing-directive-scope
      compileFunction(scope); // <== the html {{}} are bound
      expect(el.scope().login).toBeDefined();
      el.scope().login({
        username: "jenkins",
        password: "phoneme"
      }).then(function(resultScope) {
        console.log("success");
        promiseResult = resultScope;
        promisHasCompleted = true;
      }, function(resultScope) {
        console.log("fail");
        promiseResult = resultScope;
        promisHasCompleted = true;
      });

    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      expect(promiseResult).toEqual(scope);
      expect(promiseResult.application.authentication.error).toEqual("Unable to contact the server, are you sure you're not offline?");
    });

  }, specIsRunningTooLong);

  it("setting the user should indirectly causes the user to be saved locally", function() {
    var promiseResult,
      promisHasCompleted,
      anotherAuthLoad;

    runs(function() {
      anotherAuthLoad = new FieldDB.Authentication({
        user: {
          username: "jenkins"
        }
      });
      expect(anotherAuthLoad.user.researchInterest).toEqual("");

      expect(anotherAuthLoad.user.warnMessage).toContain("Refusing to save a user doc which is incomplete");
      anotherAuthLoad.user.warnMessage = "";

      // user has default prefs for now
      expect(anotherAuthLoad.user.prefs.numVisibleDatum).toEqual(10);
      expect(anotherAuthLoad.user.fieldDBtype).toEqual("User");

      anotherAuthLoad.user.fetch().then(function(userFetchResult) {
        promiseResult = userFetchResult;
        promisHasCompleted = true;
      }, function(userFetchResult) {
        promiseResult = userFetchResult;
        promisHasCompleted = true;
      });
    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      expect(promiseResult).toEqual(anotherAuthLoad.user);
      expect(anotherAuthLoad.user.researchInterest).toContain("Test automation");
      expect(anotherAuthLoad.user.prefs.unicodes.length).toEqual(22);
      expect(anotherAuthLoad.user.prefs.numVisibleDatum).toEqual(2);
    });
  }, specIsRunningTooLong);


  it("should logout users", function() {
    var promiseResult,
      promisHasCompleted;

    runs(function() {
      compileFunction(scope); // <== the html {{}} are bound
      expect(el.scope().logout).toBeDefined();

      scope.application.authentication.user = {
        username: "jenkins"
      };

      scope.application.authentication.user.fetch().then(function(resultOfFetch) {
        console.log(resultOfFetch);
        // expect(scope.application.authentication.user).toEqual(" ");
        expect(scope.application.authentication.user.researchInterest).toContain("Test automation");
        expect(scope.application.authentication.user.username).toEqual("jenkins");

        el.scope().logout().then(function(resultScope) {
          promiseResult = resultScope;
          promisHasCompleted = true;
        }, function(resultScope) {

          promiseResult = resultScope;
          promisHasCompleted = true;
        });

      }, function(errorOfFetch) {
        promiseResult = errorOfFetch;
        promisHasCompleted = true;
      });
    });

    waitsFor(function() {
      return promisHasCompleted;
    }, "waiting for the promsie to be done", specIsRunningTooLong - 200);

    runs(function() {
      expect(promiseResult.application.authentication).toEqual(scope.application.authentication);
      expect(promiseResult.application.authentication.error).toEqual("Unable to contact the server, are you sure you're not offline?");
    });
  }, specIsRunningTooLong);



});
