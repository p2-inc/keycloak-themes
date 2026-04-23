import { createKcPageStory, type Meta, type StoryObj } from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "otp-form.ftl" });

const meta = {
    title: "extensions/magic-link/otp-form.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
