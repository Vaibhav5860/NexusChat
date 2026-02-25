const express = require("express");
const { Octokit } = require("@octokit/rest");
const nodemailer = require("nodemailer");

const router = express.Router();

// ─── GitHub Issue ────────────────────────────────────────────────
router.post("/github", async (req, res) => {
  try {
    const { title, description, issueType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const labels = [];
    if (issueType === "bug") labels.push("bug");
    else if (issueType === "feature") labels.push("enhancement");

    const body = [
      `**Type:** ${issueType || "other"}`,
      "",
      "**Description:**",
      description || "_No description provided_",
      "",
      "---",
      "_Submitted from NexusChat app_",
    ].join("\n");

    const { data } = await octokit.issues.create({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      title: `[${(issueType || "OTHER").toUpperCase()}] ${title}`,
      body,
      labels,
    });

    res.json({
      success: true,
      issueUrl: data.html_url,
      issueNumber: data.number,
    });
  } catch (err) {
    console.error("GitHub issue creation failed:", err.message);
    res.status(500).json({
      error: "Failed to create GitHub issue",
      details: err.message,
    });
  }
});

// ─── Email Report ────────────────────────────────────────────────
router.post("/email", async (req, res) => {
  try {
    const { title, description, issueType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #333;">NexusChat Issue Report</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Type</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${issueType || "other"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${title}</td>
          </tr>
        </table>
        <h3 style="margin-top: 20px;">Description</h3>
        <p style="color: #555; white-space: pre-wrap;">${description || "No description provided"}</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Sent from NexusChat Report Issue</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"NexusChat Reports" <${process.env.MAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: `[NexusChat ${(issueType || "OTHER").toUpperCase()}] ${title}`,
      html: htmlBody,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email sending failed:", err.message);
    res.status(500).json({
      error: "Failed to send email",
      details: err.message,
    });
  }
});

module.exports = router;
