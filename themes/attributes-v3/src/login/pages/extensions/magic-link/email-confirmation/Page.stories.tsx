import { createKcPageStory, type Meta, type StoryObj } from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "email-confirmation.ftl" });

const meta = {
    title: "extensions/magic-link/email-confirmation.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
