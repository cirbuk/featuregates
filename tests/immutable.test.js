import "@babel/polyfill";
import FeatureGates from '../src/index';

const dummyFGs = {
    secret: {
        admins: [
            'test@doma.in',
            'user@example.com',
        ],
        internalDomains: [
            'doma.in',
            'example.com'
        ],
    },
    other: {
        testers: {
            hi: "there"
        }
    }
};

let fg;
beforeEach(() => {
    fg = new FeatureGates({
        gates: dummyFGs,
        path: 'test',
        translateMap: {
            admins: "secret.admins",
            internalDomains: 'secret.internalDomains',
            testValues: "other.testers.hi",
        }
    });
    fg.load();
});

describe('Immutability tests', () => {
    it('should get back the resolved feature-gates without any effect on key deletion', () => {
        return expect(
            (() => {
                const featureGates = fg.get();

                // deleting these keys should not affect the reference object as the response
                // of get() method is a deep-copy version of the original object
                delete featureGates.admins;
                delete featureGates.internalDomains;

                return fg.get();
            })()
        ).toEqual({
            admins: [
                'test@doma.in',
                'user@example.com',
            ],
            internalDomains: [
                'doma.in',
                'example.com'
            ],
            testValues: "there"
        })
    })
})