import { createKcPageStory, type Meta, type StoryObj } from "../../../mocks/KcPageStory";

// login.ftl as rendered by keycloak-magic-link's Cloudflare Turnstile Username Password Form.
const { KcPageStory } = createKcPageStory({ pageId: "login.ftl" });

const meta = {
    title: "extensions/cloudflare-turnstile/login.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

// Cloudflare's test site key that always passes (visible widget):
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const PASSING_TEST_SITE_KEY = "1x00000000000000000000AA";

export const WithTurnstile: Story = {
    args: {
        kcContext: {
            turnstileRequired: true,
            turnstileSiteKey: PASSING_TEST_SITE_KEY,
            turnstileAction: "login"
        }
    }
};

export const WithTurnstileError: Story = {
    args: {
        kcContext: {
            turnstileRequired: true,
            turnstileSiteKey: PASSING_TEST_SITE_KEY,
            turnstileAction: "login",
            login: {
                username: "johndoe"
            },
            messagesPerField: {
                existsError: (fieldName: string, ...otherFieldNames: string[]) =>
                    [fieldName, ...otherFieldNames].includes("cf-turnstile-response"),
                get: (fieldName: string) =>
                    fieldName === "cf-turnstile-response"
                        ? "Verification failed. Please complete the challenge and try again."
                        : ""
            }
        }
    }
};
