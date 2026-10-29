import { createKcPageStory, type Meta, type StoryObj } from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "bp-captcha.ftl" });

const meta = {
    title: "extensions/bot-protection/bp-captcha.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
    args: {
        kcContext: {
            message: {
                type: "error",
                summary: "Please complete the verification and try again."
            }
        }
    }
};
