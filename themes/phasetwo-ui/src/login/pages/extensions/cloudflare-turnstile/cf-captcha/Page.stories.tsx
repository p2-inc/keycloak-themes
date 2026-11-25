import { createKcPageStory, type Meta, type StoryObj } from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "cf-captcha.ftl" });

const meta = {
    title: "extensions/cloudflare-turnstile/cf-captcha.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

// Cloudflare's test site keys: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
// 3x...FF forces an interactive challenge, so the page doesn't auto-submit as soon as it loads.
const INTERACTIVE_TEST_SITE_KEY = "3x00000000000000000000FF";

export const Default: Story = {
    args: {
        kcContext: {
            captchaRequired: true,
            captchaSiteKey: INTERACTIVE_TEST_SITE_KEY,
            captchaAction: "login",
            captchaLanguage: "en"
        }
    }
};

export const WithAttemptedUsername: Story = {
    args: {
        kcContext: {
            captchaRequired: true,
            captchaSiteKey: INTERACTIVE_TEST_SITE_KEY,
            captchaAction: "login",
            captchaLanguage: "de",
            auth: {
                attemptedUsername: "john.doe@example.com",
                showUsername: true
            }
        }
    }
};

export const WithError: Story = {
    args: {
        kcContext: {
            captchaRequired: true,
            captchaSiteKey: INTERACTIVE_TEST_SITE_KEY,
            captchaAction: "login",
            captchaLanguage: "en",
            message: {
                type: "error",
                summary: "Verification failed. Please complete the challenge and try again."
            }
        }
    }
};
