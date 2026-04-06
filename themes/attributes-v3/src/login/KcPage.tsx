import type { ReactNode } from "react";
import { KcClsxProvider } from "@keycloakify/login-ui/useKcClsx";
import { KcContextProvider } from "./KcContext";
import type { KcContext } from "./KcContext";
import { I18nProvider } from "./i18n";
import { PageIndex } from "./pages/PageIndex";
import { useStyleLevelCustomization } from "./styleLevelCustomization";

export default function KcPage(props: { kcContext: KcContext }) {
  const { kcContext } = props;

  return (
    <KcContextProvider kcContext={kcContext}>
      <I18nProvider kcContext={kcContext}>
        <StyleLevelCustomization>
          <PageIndex />
        </StyleLevelCustomization>
      </I18nProvider>
    </KcContextProvider>
  );
}

function StyleLevelCustomization(props: { children: ReactNode }) {
  const { children } = props;

  const { doUseDefaultCss, classes, Provider } = useStyleLevelCustomization();

  return (
    <KcClsxProvider doUseDefaultCss={doUseDefaultCss} classes={classes}>
      {Provider === undefined ? children : <Provider>{children}</Provider>}
    </KcClsxProvider>
  );
}
