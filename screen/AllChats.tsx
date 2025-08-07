import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { globalStyles } from "../global/styles";
import AppHeader from "../components/global/AppHeader";
import AppContentGroup from "../components/global/AppContentGroup";
import AppNavigation from "../components/global/AppNavigation";
import SearchBar from "../components/global/SearchBar";
import NewChatItem from "../components/chats/NewChatItem";
import ChatItem from "../components/chats/ChatItem";

const HeaderComponents = () => {
  const [query, setQuery] = useState("");
  return (
    <>
      <Text
        style={[styles.headerText, { fontWeight: "800", marginBottom: 20 }]}
      >
        Talk to a Veterinarian
      </Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSearch={(q) => console.log("Searching for:", q)}
      />
    </>
  );
};

const AllChats = () => {
  return (
    <View style={globalStyles.root}>
      {/* Header */}
      <AppHeader variant={2} title="Chats" />

      {/* Content Area */}
      <AppContentGroup
        headerBackground={{ type: "color", value: "#518649" }}
        headerComponents={<HeaderComponents />}
      >
        {/* Section goes in here */}
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Start a new chat</Text>
              <Text style={styles.heading}>Available Veterinarians</Text>
            </View>
          </View>
          <View style={styles.chatItemContainer}>
            {/* Blocks for all vetenarians, chats/new chats */}
            <NewChatItem
              name="Jane Johnson"
              position="Professional Position"
              imageUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlciUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D"
              rating={5.0}
              isOnline={true}
            />
            <NewChatItem
              name="Fazal Ahmed"
              position="Professional Position"
              imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSer5NCNJ3KGlXiP1uCvk-8rOh0PACC1LnaEA&s"
              rating={5.0}
              isOnline={true}
            />
            <NewChatItem
              name="Siphwe Ncube"
              position="Professional Position"
              imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQ1iWM7UCc6j1DMSd9ATpxfkUZB2SeC44Kmw&s"
              rating={5.0}
              isOnline={false}
            />
          </View>
          {/* Show more/less button */}
        </View>

        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Your chats</Text>
              <Text style={styles.heading}>Unread messages</Text>
            </View>
          </View>
          <View style={styles.chatItemContainer}>
            {/* Blocks for all vetenarians, chats/new chats */}
            <ChatItem
              name="Johan Van der Merwe"
              time="15:45"
              message="Seems good, only 50ml will work..."
              avatarUrl="https://static.vecteezy.com/system/resources/previews/026/375/249/non_2x/ai-generative-portrait-of-confident-male-doctor-in-white-coat-and-stethoscope-standing-with-arms-crossed-and-looking-at-camera-photo.jpg"
              rating={5.0}
              isUnread={true}
            />
            <ChatItem
              name="Alfred Rabalao"
              time="15:45"
              message="2PM is perfect"
              avatarUrl="https://images.ctfassets.net/pdf29us7flmy/1osb6w6u1E2kCJn1voYZOa/777dcded6a415c6a727f5c178db4ef2e/Healthcare_close-up_shot_of_medical_doctor_smiling_-IO27_ADESKO-.jpeg"
              rating={5.0}
              isUnread={true}
            />
          </View>
          {/* Show more/less button */}
        </View>

        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>Your chats</Text>
              <Text style={styles.heading}>All Chats</Text>
            </View>
          </View>
          <View style={styles.chatItemContainer}>
            {/* Blocks for all vetenarians, chats/new chats */}
            <ChatItem
              name="Franz Schubert"
              time="15:45"
              message="Seems good, only 50ml will work..."
              avatarUrl="https://hips.hearstapps.com/hmg-prod/images/portrait-of-a-happy-young-doctor-in-his-clinic-royalty-free-image-1661432441.jpg"
              rating={5.0}
              isUnread={false}
            />
            <ChatItem
              name="Filamon Mathozi"
              time="15:45"
              message="Seems good, only 50ml will work..."
              avatarUrl="https://karenhospital.org/wp-content/uploads/2019/10/find-a-doctor-Gallery.jpg"
              rating={5.0}
              isUnread={false}
            />
            <ChatItem
              name="Mpho Meleni"
              time="15:45"
              message="Seems good, only 50ml will work..."
              avatarUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgW2SisYQ5gU_MHT0Fx5YBR78gq4JSGf2-cgTHwYGRTO_VP6gTkdXa_mnzVRdUSZ03MkY&usqp=CAU"
              rating={5.0}
              isUnread={false}
            />
          </View>
          {/* Show more/less button */}
        </View>
      </AppContentGroup>
    </View>
  );
};

export default AllChats;

const styles = StyleSheet.create({
  headerText: {
    color: "white",
    fontSize: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },
  chatItemContainer: {
    gap: 10,
  },
});
