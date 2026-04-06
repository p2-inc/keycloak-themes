<#--
  This file is owned by this project.
  To modify, edit directly and commit.

  Branding variables are read from realm attributes via the `branding` map.
  Variable names mirror the shadcn/tailwind design tokens used by the login theme.
  All color values are hex without the leading `#` (the `#` is written inline in the HTML).
  Defaults match the light-mode shadcn palette defined in login/index.css.

  Supported branding variables:
    branding.background          - page background color         (default: f2f2f2)
    branding.card                - email container background     (default: ffffff)
    branding.foreground          - body text color               (default: 1a1a1a)
    branding.primary             - button background color        (default: 171717)
    branding.primaryForeground   - button text color             (default: fafafa)
    branding.border              - border/divider color          (default: e8e8e8)
    branding.radius              - border radius                  (default: 0.65rem)
    branding.footerLine1         - first footer text line        (default: empty)
    branding.footerLine2         - second footer text line       (default: empty)
-->
<#assign branding=branding!{}>
<#macro emailLayout>
<html>
<body style="background-color:#${branding.background!"f2f2f2"};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;color:#${branding.foreground!"1a1a1a"}">
  <style>
    a.btn {
      color: #${branding.primaryForeground!"fafafa"};
      padding: 8px 20px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      text-decoration: none;
      border-radius: ${branding.radius!"0.65rem"};
      background-color: #${branding.primary!"171717"};
      display: inline-block;
    }
  </style>
  <div style="table-layout:fixed;width:100%;padding-top:30px;">
    <div style="margin:0 auto;max-width:600px">
      <!--[if mso]><table align="center" width="600" style="border-spacing:0;width:600px;" role="presentation"><tr><td><![endif]-->
      <table align="center" width="100%" role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="max-width:576px;background-color:#${branding.card!"ffffff"};border-radius:${branding.radius!"0.65rem"};color:#${branding.foreground!"1a1a1a"};margin:0 auto;margin-bottom:64px;padding:20px 0 48px;width:100%;box-shadow:0 0 #0000,0 0 #0000,0 1px 3px 0 rgb(0 0 0/0.1),0 1px 2px -1px rgb(0 0 0/0.1);"
        id="emailContainer">
        <tbody>
          <tr style="width:100%">
            <td align="center">
              <table align="center" width="100%" style="padding:0 48px" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tbody>
                  <tr>
                    <td style="color:#${branding.foreground!"1a1a1a"};">
                      <img alt="Logo" src="cid:logoLight" width="300" height="auto"
                        style="border:none;display:block;outline:none;text-decoration:none;max-height:140px;margin:0 auto;margin-bottom:24px;object-fit:contain">
                      <#nested>
                      <p style="font-size:13px;line-height:22px;margin:16px 0;text-align:center;opacity:0.7;padding-top:24px;margin-top:24px;border-top:solid 1px #${branding.border!"e8e8e8"};color:#${branding.foreground!"1a1a1a"};">
                        ${branding.footerLine1!""}
                        <#if branding.footerLine2?has_content><br />${branding.footerLine2}</#if>
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </div>
  </div>
</body>
</html>
</#macro>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
