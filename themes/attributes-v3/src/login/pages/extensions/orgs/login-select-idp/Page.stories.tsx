import {
    createKcPageStory,
    type Meta,
    type StoryObj,
} from "../../../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({
    pageId: "login-select-idp.ftl",
});

const meta = {
    title: "extensions/orgs/login-select-idp.ftl",
    component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
