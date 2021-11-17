-- Find unsubscribed email addresses. MailChimp reports audience alterations
-- to /mail/mailchimp/webhook. We store that information into table
-- "mailchimpLog". Alterations include "subscribe", "unsubscribe", "profile"
-- updates, "cleaned", etc.
-- 
-- with data: latest mailchimpLog record per email address
-- with records: join users w/ memberships which unsubribed, cleaned
--

WITH records AS (
  WITH data AS (
    SELECT
      DISTINCT ON ("email")
      "email",
      split_part(email, '@', 2) "domain",
      "createdAt",
      EXTRACT(DAYS FROM now() - "createdAt") days,
      type
      
    FROM "mailchimpLog"
    WHERE
      type IN ('subscribe', 'unsubscribe', 'cleaned')
    -- AND email LIKE '%@bluewin.ch'
    ORDER BY "email", "createdAt" DESC
  )
  
  SELECT data.*
  FROM data
  JOIN users u ON data.email = u.email
  JOIN memberships m ON m."userId" = u.id AND m."active" = TRUE
  WHERE type IN ('unsubscribe', 'cleaned')
  ORDER BY data."createdAt" DESC
)

-- SELECT * FROM records WHERE "createdAt" >= '2021-10-01' ;

-- SELECT COUNT(*) FROM records ;
-- SELECT to_char("createdAt"::date, 'YYYY'), COUNT(*)
SELECT "domain", COUNT(*)
FROM records
-- WHERE "createdAt" >= '2021-10-01' -- >= now() - '90 days'::interval
GROUP BY 1
ORDER BY 1 DESC
;
