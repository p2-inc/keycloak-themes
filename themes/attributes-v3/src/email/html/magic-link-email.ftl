<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("magicLinkBodyHtml", realmName, magicLink))?no_esc}
</@layout.emailLayout>
