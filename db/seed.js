const {
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
} = require("./index");

async function dropTables() {
  try {
    console.log("Starting to drop tables...");
    await client.query(`
            DROP TABLE IF EXISTS post_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS posts;
            DROP TABLE IF EXISTS users;
       `);
    console.log("Finished dropping tables");
  } catch (error) {
    console.error("Error dropping tables");
  }
}

async function createTables() {
  try {
    console.log("Starting to build tables...");
    await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username varchar(255) UNIQUE NOT NULL,
                password varchar(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                active BOOLEAN DEFAULT true
            );
            CREATE TABLE posts (
              id SERIAL PRIMARY KEY,
              authorid INTEGER REFERENCES users(id),
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              active BOOLEAN DEFAULT true
          );
          CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );
        CREATE TABLE post_tags (
          postid INTEGER REFERENCES posts(id),
          tagid INTEGER REFERENCES tags(id),
          UNIQUE(postid, tagid)
      );
  `);
    console.log("Finished building tables");
  } catch (error) {
    console.error("Error building tables");
  }
}

async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    const albert = await createUser({
      username: "albert",
      password: "bertie99",
      name: "alex",
      location: "tx",
    });
    /*    const albertTwo = await createUser({
      username: "albert",
      password: "imposter_albert",
    }); */
    const sandra = await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "alex",
      location: "tx",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "soglam",
      name: "alex",
      location: "tx",
    });

    console.log("Finished creating users");
  } catch (error) {
    console.error("Error creating users");
    throw error;
  }
}

async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
console.log("THIS IS FROM INITIAL POSTS", albert, sandra, glamgal)
    console.log("Starting to create posts...");
    await createPost({
      authorid: albert.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"],
    });

    await createPost({
      authorid: sandra.id,
      title: "How does this work?",
      content: "Seriously, does this even do anything?",
      tags: ["#happy", "#worst-day-ever"],
    });

    await createPost({
      authorid: glamgal.id,
      title: "Living the Glam Life",
      content: "Do you even? I swear that half of you are posing.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"],
    });
    console.log("Finished creating posts!");
  } catch (error) {
    console.log("Error creating posts!");
    throw error;
  }
}
/*
async function createInitialTags() {
  try {
    console.log("Starting to create tags...");

    const [happy, sad, inspo, catman] = await createTags([
      '#happy', 
      '#worst-day-ever', 
      '#youcandoanything',
      '#catmandoeverything'
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);

    console.log("Finished creating tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
}
*/
async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    console.error(error);
  }
}

async function testDB() {
  try {
    //connects client to db
    // client.connect()
    // queries are promises, so need to await
    const users = await getAllUsers();
    const createdUser = await createUser({
      username: "vince",
      password: "5",
      name: "alex",
      location: "TX",
    });
    console.log("getAllUsers:", users);
    console.log("createdUser:", createdUser);
    const updateUserResult = await updateUser(4, {
      name: "Newname New",
      location: "NYC, NY",
    });
    console.log("Update User Result", updateUserResult);
    let NewTitle = "This is a title";
    let NewContent = "This is a content";
    await createPost({
      authorid: 4,
      title: NewTitle,
      content: NewContent,
      tags: ["hi"],
    });
    console.log("Created a Post");
    await updatePost(1, { title: "Updated Title", content: "Updated Content" });
    console.log("Updated a Post");
    const posts = await getAllPosts();
    console.log(await getUserById(4));
    await createTags(["#funny", "#cool", "#sad"]);
    console.log("Created tags");
    console.log("added tags to post");
    const [happy, funny] = await createTags(["#happy", "#funny"]);
    await addTagsToPost(4, [happy, funny]);
    console.log(await getPostById(4));
    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
    });
    console.log("Result:", updatePostTagsResult);
    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);
    console.log("Finished database tests");
  } catch (error) {
    console.error("Error testing database");
    throw error;
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
