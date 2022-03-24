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
async function createPost({ authorid, title, content }) {
  try {
    const { rows } = await client.query(
      `
        INSERT INTO posts(authorid, title, content) 
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
      [authorid, title, content]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, fields = { title, content, active }) {
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
      rows: [post],
    } = await client.query(
      `
    UPDATE posts
    SET ${setString}
    WHERE id=${id}
    RETURNING *;
    `,
      Object.values(fields)
    );

    return post;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  const { rows } = await client.query(
    `SELECT id, authorid, title, content, active
          FROM posts;`
  );

  return rows;
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
        SELECT * FROM posts
        WHERE authorid=${userId};
      `);

    return rows;
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
};
