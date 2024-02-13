package io.phasetwo.keycloak.themes.theme;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AttributeThemeProviderFactoryTest {

    @Test
    void createAndClose() {
        AttributeThemeProviderFactory attributeThemeProviderFactory = new AttributeThemeProviderFactory();
        var themeProvider = (AttributeThemeProvider) attributeThemeProviderFactory.create(null);
        assertTrue(themeProvider.getTmpDir().exists());

        attributeThemeProviderFactory.close();
        assertFalse(themeProvider.getTmpDir().exists());
    }

}