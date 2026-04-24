<#--
  This file has been claimed for ownership from @keycloakify/email-native version 260007.0.0.
  To relinquish ownership and restore this file to its original content, run the following command:

  $ npx keycloakify own --path "email/html/template.ftl" --revert

  Branding variables are read from realm attributes via the `branding` map,
  populated by DefaultAttributesBuilderProvider from the following realm attributes:
    _providerConfig.assets.logo.base64  → branding.logoLight  (data URI; also drives CID attachment)
    _providerConfig.assets.email.footer.line1 → branding.footerLine1
    _providerConfig.assets.email.footer.line2 → branding.footerLine2
  All color values use hardcoded defaults for now (background, card, text, etc.).
  -->
  <#assign branding=branding!{}>
    <#macro emailLayout>
      <html>

      <body style="background-color:#f2f2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;color:#1a1a1a">
        <style>
        a.btn {
          color: #fafafa;
          padding: 8px 20px;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          text-decoration: none;
          border-radius: 0.65rem;
          background-color: #171717;
          display: inline-block;
        }
        </style>
        <div style="table-layout:fixed;width:100%;padding-top:30px;">
          <div style="margin:0 auto;max-width:600px">
            <!--[if mso]
><table align="center" width="600" style="border-spacing:0;width:600px;" role="presentation"><tr><td><![endif]
-->
            <table align="center" width="100%" role="presentation" cellspacing="0" cellpadding="0" border="0"
              style="max-width:576px;background-color:#ffffff;border-radius:0.65rem;color:#1a1a1a;margin:0 auto;margin-bottom:64px;padding:48px 0 16px;width:100%;box-shadow:0 0 #0000,0 0 #0000,0 1px 3px 0 rgb(0 0 0/0.1),0 1px 2px -1px rgb(0 0 0/0.1);"
              id="emailContainer">
              <tbody>
                <tr style="width:100%">
                  <td align="center">
                    <table align="center" width="100%" style="padding:0 48px" border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tbody>
                        <tr>
                          <td style="color:#1a1a1a;">
                            <img alt="Logo" src="cid:logoLight" style="border:none;display:block;outline:none;text-decoration:none;max-width:160px;max-height:60px;width:auto;height:auto;margin:0 auto;margin-bottom:24px;">
                            <#nested>
                              <p style="font-size:13px;line-height:22px;margin:16px 0;text-align:center;opacity:0.7;padding-top:24px;margin-top:24px;border-top:solid 1px #e8e8e8;color:#1a1a1a;">
                                <#if branding.footerLine1?has_content>
                                  ${branding.footerLine1}
                                <#else>
                                  ${realmName!realm.displayName!realm.name}
                                </#if>
                                <#if branding.footerLine2?has_content>
                                  <br />${branding.footerLine2}
                                </#if>
                                <br />
                                Powered by <a href="https://phasetwo.io" style="color:#171717;text-decoration:underline;" target="_blank">Phase Two</a>
                              </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <!--[if mso]
></td></tr></table><![endif]
-->
          </div>
        </div>
      </body>

      </html>
    </#macro>
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">