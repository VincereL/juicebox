const { Client } = require("pg");
//imports from pg module

const client = new Client("postgres://localhost:5432/juicebox-dev");

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location
        FROM users;`
  );

  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const { rows } = await client.query(
      `
        INSERT INTO users(username, password, name, location) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `,
      [username, password, name, location]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  // build the set string

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" =$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [user],
    } = await client.query(
      `
  UPDATE users
  SET ${setString}
  WHERE id=${id}
  RETURNING *;
  `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
}
async function createPost({
  authorid,
  title,
  content,
  tags = [] // this is new
}) {
  try {
    const { rows: [ post ] } = await client.query(`
      INSERT INTO posts(authorid, title, content) 
      VALUES($1, $2, $3)
      RETURNING *;
    `, [authorid, title, content]);

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}

async function updatePost(postid, fields = { }) {
  // build the set string
  const { tags } = fields; // might be undefined
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" =$${index + 1}`)
    .join(", ");

  // return early if this is called without fields

  
  try {
    // update any fields that need to be updated
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postid }
        RETURNING *;
      `, Object.values(fields));
    }

    // return early if there's no tags to update
    if (tags === undefined) {
      return await getPostById(postid);
    }

    // make any new tags that need to be made
    const tagList = await createTags(tags);
    const tagListIdString = tagList.map(
      tag => `${ tag.id }`
    ).join(', ');

    // delete any post_tags from the database which aren't in that tagList
    await client.query(`
      DELETE FROM post_tags
      WHERE tagid
      NOT IN (${ tagListIdString })
      AND postid=$1;
    `, [postid]);

    // and create post_tags as necessary
    await addTagsToPost(postid, tagList);

    return await getPostById(postid);
  } catch (error) {
    throw error;
  
  }
}

async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts;
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id 
      FROM posts 
      WHERE authorid=${ userId };
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
        SELECT * FROM users
        WHERE id=${userId};
      `);

    // const setString = Object.keys(fields)
    //   .map((key, index) => `"${key}" =$${index + 1}`)
    //   .join(", ");

    // return early if this is called without fields
    if (!user) {
      return null;
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
}

// async function createTags(tagList) {
//   if (!tagList) {
//     return null;
//   }    
//   const insertValues = tagList
//     .map((key) => `${key}`)
//     .join(", ");
// console.log("insertvalues", insertValues)
//   const selectValues = tagList
//   .map((_, index) => `$${index + 1}`)
//   .join(", ");

//   try {

//     await client.query(`
//       INSERT INTO tags(name)
//       VALUES ((${ selectValues }))
//       ON CONFLICT (name) DO NOTHING`, [tagList])


//       const {rows } = await client.query(`  
//       SELECT * FROM tags
//       WHERE name
//       IN (${insertValues})
//     `, [tagList]);
//     return rows

//   } catch (error) {
//     throw error;
//   }
// }

async function createTags(tagList) {
  if (!tagList) {
    return null;
  }    

  // insertValues = insertvalues ($1), ($2), ($3)
  const insertValues = tagList.map (
    (_, index) => `$${index + 1}`).join('), (');

    // selectValues = $1, $2, $3
  const selectValues = tagList .map(
    (_, index) => `$${index + 1}`).join(', ');

  try {

    await client.query(`
      INSERT INTO tags(name)
      VALUES (${ insertValues })
      ON CONFLICT (name) DO NOTHING;`, tagList);

    const {rows } = await client.query(`  
      SELECT * FROM tags
      WHERE name
      IN (${ selectValues })
    `, tagList);
    
    console.log("return from createTags:", rows)
    return rows

  } catch (error) {
    throw error;
  }
}

async function createPostTag(postid, tagid){
  try {
    await client.query(`
      INSERT INTO post_tags(postid, tagid)
      VALUES ($1, $2)
      ON CONFLICT (postid, tagid) DO NOTHING;
      `, [postid, tagid])
  } catch (error) {
    
  }
}

async function getPostById(postid) {
  try {
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postid]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags.tagid
      WHERE post_tags.postid=$1;
    `, [postid])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorid])

    post.tags = tags;
    post.author = author;

    delete post.authorid;

    return post;
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postid, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postid, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postid);
  } catch (error) {
    throw error;
  }
}

async function getPostsByTagName(tagName) {
  try {
    const { rows: postids } = await client.query(`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags.postid
      JOIN tags ON tags.id=post_tags.tagid
      WHERE tags.name=$1;
    `, [tagName]);

    return await Promise.all(postids.map(
      post => getPostById(post.id)
    ));
  } catch (error) {
    throw error;
  }
} 
module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getUserById,
  getPostsByUser,
  createTags,
  createPostTag,
  getPostById,
  addTagsToPost,
  getPostsByTagName
};
