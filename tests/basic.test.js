import "@babel/polyfill";
import FeatureGates from '../src/index';

const dummyFGs = {
  workspaces: {
    "preprocess-enabled": [1, 2, 3]
  },
  test: {
    testers: {
      hi: "there"
    }
  }
};

const firestoreDummy = {
  doc() {
    return {
      get() {
        return new Promise((resolve, reject) => {
          resolve({
            data() {
              return dummyFGs;
            }
          });
        });
      }
    }
  }
};

describe("Factory tests", () => {
  it("1. Should throw error when no 'path' is provided", () => {
    return expect(() => new FeatureGates({
      firestore: firestoreDummy,
      path: '',
      logOnReload: true
    })).toThrowError(new Error(`Invalid string provided as "path"`));
  });

  it("2. Should throw error when no 'logger' is provided with logging enabled", () => {
    return expect(() => new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      logOnReload: true
    })).toThrowError(new Error(`"logger" should be provided if "logOnReload" needs to be enabled`));
  });

  it("3. Should throw error when 'logger' is provided but without info function", () => {
    return expect(() => new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      logOnReload: true,
      logger: {}
    })).toThrowError(new Error(`"logger" should be an object with an "info" function`));
  });

  it("4. Should throw error when 'onLoaded' is provided but is not a function function", () => {
    return expect(() => new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      onLoaded: {}
    })).toThrowError(new Error(`"onLoaded" should be a function`));
  });

  it("5. Should initialize properly", () => {
    return expect(() => {
      new FeatureGates({
        firestore: firestoreDummy,
        path: 'test',
        logOnReload: true,
        logger: {
          info() {
          }
        },
        onLoaded() {
        }
      });
      return true;
    }).toBeTruthy();
  });

  it("5. Should set gates with translation", () => {
    const fg = new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      translateMap: {
        preprocessEnabledWorkspaces: "workspaces.preprocess-enabled",
        testValues: "test.testers.hi"
      }
    });
    fg.set({
      workspaces: {
        "preprocess-enabled": [1, 2, 3]
      },
      test: {
        testers: {
          hi: "there"
        }
      }
    });
    return expect(fg.get()).toEqual({
      preprocessEnabledWorkspaces: [1, 2, 3],
      testValues: "there"
    });
  });

  it("6. Should set and get a specific gate after translation", () => {
    const fg = new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      translateMap: {
        preprocessEnabledWorkspaces: "workspaces.preprocess-enabled",
        testValues: "test.testers.hi"
      }
    });
    fg.set(dummyFGs);
    return expect(fg.get('testValues')).toEqual("there");
  });

  it("7. Should set and get a non-existent gate with default value", () => {
    const fg = new FeatureGates({
      firestore: firestoreDummy,
      path: 'test',
      translateMap: {
        preprocessEnabledWorkspaces: "workspaces.preprocess-enabled",
        testValues: "test.testers.hi"
      }
    });
    fg.set(dummyFGs);
    return expect(fg.get('blast', {
      defaultValue: {}
    })).toEqual({});
  });

  it("8. Should load featuregates directly", async () => {
    const fg = new FeatureGates({
      gates: dummyFGs,
      translateMap: {
        preprocessEnabledWorkspaces: "workspaces.preprocess-enabled",
        testValues: "test.testers.hi"
      }
    });
    fg.load();
    return expect(fg.get('testValues', {})).toEqual("there");
  });
});