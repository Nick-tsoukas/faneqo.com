"use strict";

module.exports = {
  async confirmEmail(ctx) {
    const { token } = ctx.query;
    if (!token) {
      console.log("No token found in query parameters");
      return ctx.badRequest("Missing token.");
    }
    
    console.log("Received token:", token);
    
    // Find the user with the matching confirmation token
    const user = await strapi.db.query("plugin::users-permissions.user").findOne({
      where: { confirmationToken: token },
    });
    
    console.log("User found:", user);
    
    if (!user) {
      console.log("No user found for the provided token");
      return ctx.badRequest("Invalid or expired token.");
    }
    
    // Update the user: mark as confirmed and remove the token
    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: {
        confirmed: true,
        confirmationToken: null,
      },
    });
    
    // Generate a JWT for the user
    const jwt = strapi.plugin("users-permissions").service("jwt").issue({ id: user.id });
    
    console.log("JWT generated:", jwt);
    
    // Redirect to the frontend dashboard with the JWT as a query parameter
    const _appUrl = String(process.env.PUBLIC_APP_URL || 'https://musicbizqr.com').replace(/\/+$/, '');
    ctx.redirect(`${_appUrl}/dashboard?token=${jwt}`);
    // For local testing, you might use:
    // ctx.redirect(`http://localhost:3000/dashboard?token=${jwt}`);
  },
};
