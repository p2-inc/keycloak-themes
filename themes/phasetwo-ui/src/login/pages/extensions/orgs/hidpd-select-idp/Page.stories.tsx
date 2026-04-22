import {
    createKcPageStory,
    type Meta,
    type StoryObj,
} from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({
    pageId: "hidpd-select-idp.ftl",
});

const meta = {
    title: "extensions/orgs/hidpd-select-idp.ftl",
    component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
