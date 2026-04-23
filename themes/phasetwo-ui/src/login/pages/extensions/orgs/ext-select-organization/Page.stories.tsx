import {
    createKcPageStory,
    type Meta,
    type StoryObj,
} from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({
    pageId: "ext-select-organization.ftl",
});

const meta = {
    title: "extensions/orgs/ext-select-organization.ftl",
    component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
